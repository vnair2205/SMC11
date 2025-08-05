// server/controllers/courseController.js
const { google } = require('googleapis');
const { generateWithFallback, getNextYoutubeKey, getNextPexelsKey } = require('../utils/apiKeyManager');
const Course = require('../models/Course');
const Chat = require('../models/Chat');
const axios = require('axios');
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');


const cleanAIText = (text) => {
    if (typeof text !== 'string') return '';
    const lines = text.split(/\n\s*(?=\d+\.)/g);
    return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(line => line.length > 0);
};

const cleanSingleLine = (text) => {
    if (typeof text !== 'string') return '';
    return text.replace(/[\*#]/g, '').trim();
};

const fetchCourseThumbnail = async (topic) => {
    try {
        const pexelsKey = getNextPexelsKey();
        if (!pexelsKey) {
            console.warn('[Pexels] No Pexels API key available. Skipping thumbnail fetch.');
            return null;
        }

        const query = encodeURIComponent(topic);
        const pexelsApiUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`;

        console.log(`[Pexels] Searching for thumbnail for topic: "${topic}"`);
        const response = await axios.get(pexelsApiUrl, {
            headers: {
                Authorization: pexelsKey
            }
        });

        if (response.data.photos && response.data.photos.length > 0) {
            const thumbnailUrl = response.data.photos[0].src.medium;
            console.log(`[Pexels] Found thumbnail: ${thumbnailUrl}`);
            return thumbnailUrl;
        } else {
            console.log('[Pexels] No suitable thumbnail found for this topic.');
            return null;
        }
    } catch (error) {
        console.error("[Pexels] Error fetching thumbnail:", error.response ? error.response.data : error.message);
        return null;
    }
};

const findBestVideo = (videos, { lessonTitle, subtopicTitle, courseTopic }) => {
    if (!videos || videos.length === 0) {
        return null;
    }

    const scoredVideos = videos
        .map(video => {
            if (!video.id?.videoId || !video.snippet?.title) {
                return null;
            }

            const title = video.snippet.title.toLowerCase();
            const description = (video.snippet.description || '').toLowerCase();
            
            if (title.includes('#shorts') || description.includes('#shorts')) {
                return null;
            }

            let score = 0;
            if (title.includes(lessonTitle.toLowerCase())) score += 10;
            if (title.includes(subtopicTitle.toLowerCase())) score += 5;
            if (title.includes(courseTopic.toLowerCase())) score += 2;

            return { video, score };
        })
        .filter(Boolean);

    if (scoredVideos.length === 0) {
        return videos.find(v => v.id?.videoId && !v.snippet.title.toLowerCase().includes('#shorts')) || null;
    }

    scoredVideos.sort((a, b) => b.score - a.score);
    return scoredVideos[0].video;
};


const callOpenAI = async (prompt, response_format = {}) => {
    const openaiApiKey = getOpenAIApiKey();
    if (!openaiApiKey) {
        throw new Error("OpenAI API key not configured.");
    }
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo-1106",
        messages: [{ role: "user", content: prompt }],
        response_format: response_format
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
        }
    });
    return response.data.choices[0].message.content;
};

exports.refineTopic = async (req, res) => {
    console.log('[API] /refine-topic called');
    const { topic, languageName, nativeName } = req.body;
    if (!topic) return res.status(400).json({ msg: 'Topic is required' });
    try {
        const prompt = `A user wants to learn about: "${topic}". Suggest three improved course titles. IMPORTANT: Your response MUST be a valid JSON array of objects. Each object should have a "title" in the ${languageName} (${nativeName}) language and an "englishTitle" in English. Example: [{"title": "Title 1", "englishTitle": "English Title 1"}, {"title": "Title 2", "englishTitle": "English Title 2"}, {"title": "Title 3", "englishTitle": "English Title 3"}]`;
        console.log('[AI] Generating topic suggestions...');
        const rawText = await generateWithFallback(prompt, { type: "json_object" });
        const cleanedJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let suggestions = JSON.parse(cleanedJsonString);

        if (!Array.isArray(suggestions) || !suggestions.every(s => s.title && s.englishTitle)) {
            console.error("AI response for refineTopic has invalid structure:", suggestions);
            throw new Error("AI response for refineTopic has invalid structure.");
        }

        console.log('[AI] Suggestions generated successfully.');
        res.json({ suggestions });
    } catch (error) {
        console.error("--- ERROR IN refineTopic ---", error);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.generateObjective = async (req, res) => {
    console.log('[API] /generate-objective called');
    const { topic, englishTopic, language, languageName, nativeName } = req.body;
    const userId = req.user.id;
    if (!topic || !englishTopic) return res.status(400).json({ msg: 'Topic and English topic are required' });
    try {
        // Generate objectives in the native language
        const nativePrompt = `Generate 4-5 learning objectives for a course on: "${topic}". The response must be in a numbered list format in the ${languageName} (${nativeName}) language.`;
        console.log('[AI] Generating course objectives in native language...');
        const nativeRawText = await generateWithFallback(nativePrompt);
        const cleanedObjectives = cleanAIText(nativeRawText);

        // Generate objectives in English
        const englishPrompt = `Generate the exact same 4-5 learning objectives for a course on: "${englishTopic}", but in the English language. The response must be a numbered list.`;
        console.log('[AI] Generating course objectives in English...');
        const englishRawText = await generateWithFallback(englishPrompt);
        const cleanedEnglishObjectives = cleanAIText(englishRawText);

        const thumbnailUrl = await fetchCourseThumbnail(englishTopic);
        
        console.log('[DB] Creating new course with bilingual objectives...');
        const newCourse = new Course({
            user: userId,
            topic,
            englishTopic,
            objective: cleanedObjectives,
            englishObjective: cleanedEnglishObjectives, // Save English version
            language,
            languageName,
            nativeName,
            thumbnailUrl: thumbnailUrl
        });
        await newCourse.save();
        console.log('[DB] Course created with ID:', newCourse._id);
        res.json({ objective: cleanedObjectives, courseId: newCourse._id });
    } catch (error) {
        console.error("--- ERROR IN generateObjective ---", error);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.refineSingleObjective = async (req, res) => {
    console.log('[API] /refine-objective called');
    const { courseId, newObjectiveText } = req.body;
    const userId = req.user.id;
    if (!courseId || !newObjectiveText) return res.status(400).json({ msg: 'Course ID and objective text are required' });

    try {
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        const prompt = `For a course on "${course.topic}" in the ${course.languageName} language, a user has provided this learning objective: "${newObjectiveText}". Refine this into 2-3 improved and concise versions. IMPORTANT: Your response MUST be a valid JSON array of strings. Each string should be a refined objective. Example: ["Refined objective 1", "Refined objective 2"]`;
        
        console.log('[AI] Refining single objective...');
        const rawText = await generateWithFallback(prompt, { type: "json_object" });
        const cleanedJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(cleanedJsonString);

        if (!Array.isArray(suggestions)) {
             console.error("AI response for refineSingleObjective has invalid structure:", suggestions);
            throw new Error("AI response for refineSingleObjective has invalid structure.");
        }

        res.json({ suggestions });
    } catch (error) {
        console.error("Error refining single objective:", error);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.generateOutcome = async (req, res) => {
    console.log('[API] /generate-outcome called');
    const { courseId, topic, englishTopic, objective, languageName, nativeName } = req.body;
    if (!courseId || !topic || !objective) return res.status(400).json({ msg: 'ID, topic, and objective are required' });
    try {
        const objectivesString = objective.join('; ');

        // Generate outcomes in the native language
        const nativePrompt = `Based on topic "${topic}" and objectives "${objectivesString}", generate 4-5 learning outcomes. The response must be in a numbered list format in the ${languageName} (${nativeName}) language.`;
        console.log('[AI] Generating course outcomes in native language...');
        const nativeRawText = await generateWithFallback(nativePrompt);
        const cleanedNativeText = cleanAIText(nativeRawText).join('\n');

        // Generate outcomes in English
        const englishPrompt = `Based on topic "${englishTopic}" and objectives "${objectivesString}", generate the exact same 4-5 learning outcomes, but in the English language. The response must be a numbered list.`;
        console.log('[AI] Generating course outcomes in English...');
        const englishRawText = await generateWithFallback(englishPrompt);
        const cleanedEnglishText = cleanAIText(englishRawText).join('\n');
        
        console.log('[DB] Updating course with bilingual outcomes...');
        const course = await Course.findByIdAndUpdate(courseId, { 
            outcome: cleanedNativeText,
            englishOutcome: cleanedEnglishText // Save English version
        }, { new: true });

        if (!course) return res.status(404).json({ msg: 'Course not found' });
        console.log('[DB] Course outcomes saved.');
        res.json({ outcome: course.outcome });
    } catch (error) {
        console.error("Error generating outcome:", error);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.refineLesson = async (req, res) => {
    console.log('[API] /refine-lesson called');
    const { topic, subtopicTitle, lessonInput, languageName, nativeName } = req.body;
    const { englishTopic, englishSubtopicTitle } = req.body;

    if (!topic || !subtopicTitle || !lessonInput) return res.status(400).json({ msg: 'Topic, subtopic, and lesson are required' });
    try {
        const prompt = `For a course on "${topic}" (English: ${englishTopic || topic}) in the subtopic "${subtopicTitle}" (English: ${englishSubtopicTitle || subtopicTitle}), a user entered a lesson idea: "${lessonInput}". Suggest three improved titles. IMPORTANT: Your response MUST be a valid JSON array of three objects. Each object should have a "title" in the ${languageName} (${nativeName}) language and an "englishTitle" in English. Example: [{"title": "Title 1", "englishTitle": "English Title 1"}, {"title": "Title 2", "englishTitle": "English Title 2"}, {"title": "Title 3", "englishTitle": "English Title 3"}]`;
        console.log('[AI] Generating lesson suggestions...');
        const rawText = await generateWithFallback(prompt, { type: "json_object" });
        const cleanedJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsedSuggestions = JSON.parse(cleanedJsonString);

        if (!Array.isArray(parsedSuggestions) || !parsedSuggestions.every(s => s.title && s.englishTitle)) {
            console.error("AI response for refineLesson has invalid structure:", parsedSuggestions);
            throw new Error("AI response for refineLesson has invalid structure.");
        }

        console.log('[AI] Lesson suggestions generated.');
        res.json({ suggestions: parsedSuggestions });
    } catch (error) {
        console.error("Error refining lesson:", error.response ? error.response.data : error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.generateIndex = async (req, res) => {
    console.log('[API] /generate-index called');
    const { courseId, topic, objective, outcome, numSubtopics, language, languageName, nativeName, customLessons } = req.body;
    const { englishTopic } = req.body;

    if (!courseId || !topic || !objective || !outcome || !numSubtopics) return res.status(400).json({ msg: 'Missing details for index generation.' });

    try {
        const subtopicText = numSubtopics === 1 ? '1 subtopic' : `${numSubtopics} subtopics`;
        const objectivesString = objective.join('; ');
        
        const prompt = `Generate a comprehensive and detailed course index for "${topic}" that strictly follows the provided learning objectives and outcomes. The course should have exactly ${subtopicText}, and each subtopic should contain 3-5 lessons.

        The core learning objectives for this course are: "${objectivesString}".
        The expected outcomes are: "${outcome}".

        IMPORTANT: Your response MUST be a valid JSON object. All 'title' fields must be in the ${languageName} (${nativeName}) language, and all 'englishTitle' fields must be in English. If the language is English, the 'title' and 'englishTitle' should be the same. Structure: { "subtopics": [{ "title": "...", "englishTitle": "...", "lessons": [{"title": "...", "englishTitle": "..."}, {"title": "...", "englishTitle": "..."}] }] }`;

        console.log('[AI] Generating course index with a refined prompt...');
        const rawText = await generateWithFallback(prompt, { type: "json_object" });
        const cleanedJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        let generatedIndex = JSON.parse(cleanedJsonString);

        if (!Array.isArray(generatedIndex.subtopics)) {
            console.error("AI response for generateIndex has invalid 'subtopics' structure:", generatedIndex);
            throw new Error("AI response for generateIndex has invalid 'subtopics' structure.");
        }

        let formattedIndex = {
            subtopics: generatedIndex.subtopics.map(subtopic => ({
                title: subtopic.title,
                englishTitle: subtopic.englishTitle || subtopic.title,
                lessons: subtopic.lessons.map(lesson => ({
                    title: lesson.title,
                    englishTitle: lesson.englishTitle || lesson.title,
                }))
            }))
        };

        if (customLessons && customLessons.length > 0) {
            console.log('[DB] Integrating custom lessons into generated index...');
            customLessons.forEach(customLesson => {
                const targetSubtopic = formattedIndex.subtopics[customLesson.subtopicIndex];
                if (targetSubtopic) {
                    const isDuplicate = targetSubtopic.lessons.some(
                        lesson => lesson.title.toLowerCase() === customLesson.title.toLowerCase()
                    );
                    if (!isDuplicate) {
                        targetSubtopic.lessons.push({ title: customLesson.title, englishTitle: customLesson.englishTitle || customLesson.title });
                        console.log(`[DB] Added custom lesson "${customLesson.title}" to subtopic ${customLesson.subtopicIndex + 1}.`);
                    } else {
                        console.log(`[DB] Skipped duplicate custom lesson "${customLesson.title}" for subtopic ${customLesson.subtopicIndex + 1}.`);
                    }
                } else {
                    console.warn(`[DB] Target subtopic index ${customLesson.subtopicIndex} not found for custom lesson "${customLesson.title}".`);
                }
            });
        }

        console.log('[DB] Updating course with index...');
        const course = await Course.findByIdAndUpdate(courseId, { index: formattedIndex, numSubtopics, language }, { new: true });
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        console.log('[DB] Course index saved.');
        res.json({ index: course.index });
    } catch (error) {
        console.error("Error generating index:", error.response ? error.response.data : error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.courseId, user: req.user.id });
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        if (!course.englishTopic) {
            course.englishTopic = course.topic;
        }
        course.index.subtopics = course.index.subtopics.map(sub => {
            if (!sub.englishTitle) sub.englishTitle = sub.title;
            sub.lessons = sub.lessons.map(lesson => {
                if (!lesson.englishTitle) lesson.englishTitle = lesson.title;
                return lesson;
            });
            return sub;
        });


        res.json(course);
    } catch (error) {
        console.error("Error fetching course:", error.message);
        if (error.kind === 'ObjectId') return res.status(404).json({ msg: 'Course not found' });
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.generateLessonContent = async (req, res) => {
    console.log('[API] /lesson/generate called');
    const { courseId, subtopicId, lessonId } = req.body;
    const userId = req.user.id;

    try {
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        const subtopic = course.index.subtopics.id(subtopicId);
        if (!subtopic) return res.status(404).json({ msg: 'Subtopic not found' });

        const lesson = subtopic.lessons.id(lessonId);
        if (!lesson) return res.status(404).json({ msg: 'Lesson not found' });

        const shouldGenerateNewContent = !lesson.content || !lesson.videoUrl;

        let videoUrl = lesson.videoUrl;
        let videoChannelId = lesson.videoChannelId;
        let videoChannelTitle = lesson.videoChannelTitle;
        let videoHistory = lesson.videoHistory;
        let videoChangeCount = lesson.videoChangeCount;

        if (shouldGenerateNewContent) {
            try {
               const apiKey = getNextYoutubeKey();
            const englishCourseTopic = course.englishTopic || course.topic;
            const englishSubtopicTitle = subtopic.englishTitle || subtopic.title;
            const englishLessonTitle = lesson.englishTitle || lesson.title;

                const searchQuery = encodeURIComponent(`${englishCourseTopic} ${englishSubtopicTitle} ${englishLessonTitle} tutorial`);
            const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&videoEmbeddable=true&maxResults=10&key=${apiKey}&relevanceLanguage=en&videoDuration=medium`;
                
                  console.log(`[YouTube] Searching with improved query: "${searchQuery}"`);
            const youtubeResponse = await axios.get(youtubeApiUrl);
            
            const bestVideo = findBestVideo(youtubeResponse.data.items, {
                lessonTitle: englishLessonTitle,
                subtopicTitle: englishSubtopicTitle,
                courseTopic: englishCourseTopic
            });
            
            if (bestVideo) {
                videoUrl = `https://www.youtube.com/embed/${bestVideo.id.videoId}`;
                videoChannelId = bestVideo.snippet.channelId;
                videoChannelTitle = bestVideo.snippet.channelTitle;
                console.log(`[YouTube] Found best video ID: ${bestVideo.id.videoId}`);
            } else {
                console.log('[YouTube] No suitable video found after filtering.');
            }
        } catch (youtubeError) {
            console.error("[Error] YouTube API Error (generateLessonContent):", youtubeError.response ? youtubeError.response.data : youtubeError.message);
        }
            const prompt = `
            You are an expert tutor designing a self-paced course. For the course "${course.topic}", in the subtopic "${subtopic.title}", generate detailed and engaging lesson content for the topic "${lesson.title}".

           The goal is to provide a complete learning experience that a user can understand on their own.

           The content should be structured as follows:

            ### Welcome to this Lesson!
            Start with a friendly and encouraging welcome that sets the stage for the lesson. Briefly introduce the topic and why it is important for the overall course.

            ### Understanding ${lesson.title}
    Provide a comprehensive explanation of the topic.
    - Break down complex ideas into clear, digestible paragraphs.
    - Use bullet points or numbered lists to present key concepts and facts.
    - Include concrete, real-world examples to illustrate the concepts.
    - Explain any technical jargon or new terms simply and clearly.

            ### Practice Assignment: Self-Assessment
    Create a practical, self-contained assignment. The user should be able to complete this on their own to apply what they've learned. Provide clear, step-by-step instructions.


          ### Self-Evaluation Criteria
    Give the learner a simple rubric or a list of criteria to help them evaluate their own work. This should empower them to judge their understanding without needing a formal instructor.

    ### Key Takeaways
    End the lesson with a concise summary of the most important points. This will help the user quickly review the material and reinforce their learning.

             All content must be well-structured and written entirely in the ${course.languageName} (${course.nativeName}) language.
            `;
            console.log('[AI] Generating lesson content with detailed structure...');
            const rawText = await generateWithFallback(prompt);
            const cleanedText = cleanSingleLine(rawText);
            console.log('[AI] Lesson content generated.');

            lesson.content = cleanedText;
            lesson.videoUrl = videoUrl;
            lesson.videoChannelId = videoChannelId;
            lesson.videoChannelTitle = videoChannelTitle;
            lesson.videoHistory = [{ videoUrl: videoUrl, videoChannelId: videoChannelId, videoChannelTitle: videoChannelTitle }];
            lesson.videoChangeCount = 0;
            lesson.isCompleted = true;
            await course.save();
              res.json(lesson);

        } else if (!lesson.isCompleted) {
            lesson.isCompleted = true;
        }

        const updatedCourse = await Course.findOneAndUpdate(
            {
                _id: courseId,
                user: userId,
                'index.subtopics._id': subtopicId,
                'index.subtopics.lessons._id': lessonId
            },
            {
                $set: {
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].isCompleted': lesson.isCompleted,
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].content': lesson.content,
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].videoUrl': lesson.videoUrl,
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].videoChannelId': lesson.videoChannelId,
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].videoChannelTitle': lesson.videoChannelTitle,
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].videoHistory': lesson.videoHistory,
                    'index.subtopics.$[subtopicElem].lessons.$[lessonElem].videoChangeCount': lesson.videoChangeCount
                }
            },
            {
                new: true,
                arrayFilters: [
                    { 'subtopicElem._id': subtopicId },
                    { 'lessonElem._id': lessonId }
                ],
                runValidators: true
            }
        );

        if (!updatedCourse) {
            console.error('[DB] Failed to find and update specific lesson subdocument.');
            return res.status(404).json({ msg: 'Course or lesson not found during update.' });
        }

        console.log('[DB] Lesson content and completion status saved.');

        const updatedSubtopic = updatedCourse.index.subtopics.id(subtopicId);
        const updatedLesson = updatedSubtopic.lessons.id(lessonId);

        res.json(updatedLesson);

    } catch (error) {
        console.error("Error in generateLessonContent:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.changeLessonVideo = async (req, res) => {
    const { courseId, subtopicId, lessonId } = req.body;
    const userId = req.user.id;
    try {
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        const subtopic = course.index.subtopics.id(subtopicId);
        if (!subtopic) return res.status(404).json({ msg: 'Subtopic not found' });
        const lesson = subtopic.lessons.id(lessonId);
        if (!lesson) return res.status(404).json({ msg: 'Lesson not found' });
        if (lesson.videoChangeCount >= 3) {
            return res.status(400).json({ msgKey: 'errors.video_change_limit' });
        }
        
        const apiKey = getNextYoutubeKey();
        const englishCourseTopic = course.englishTopic || course.topic;
        const englishSubtopicTitle = subtopic.englishTitle || subtopic.title;
        const englishLessonTitle = lesson.englishTitle || lesson.title;

        // --- THIS IS THE UPDATED, MORE SPECIFIC SEARCH QUERY ---
        const searchQuery = encodeURIComponent(`${englishCourseTopic} ${englishSubtopicTitle} ${englishLessonTitle} tutorial`);
        const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&videoEmbeddable=true&maxResults=10&key=${apiKey}&relevanceLanguage=en&videoDuration=medium`;

        console.log(`[YouTube] Searching for new video with query: "${searchQuery}"...`);
        const youtubeResponse = await axios.get(youtubeApiUrl);
        
        const existingVideoIds = lesson.videoHistory.map(v => v.videoUrl.split('/embed/')[1]);
        const newVideos = youtubeResponse.data.items.filter(v => !existingVideoIds.includes(v.id.videoId));
        
        const bestVideo = findBestVideo(newVideos, {
            lessonTitle: englishLessonTitle,
            subtopicTitle: englishSubtopicTitle,
            courseTopic: englishCourseTopic
        });

        if (bestVideo) {
            lesson.videoUrl = `https://www.youtube.com/embed/${bestVideo.id.videoId}`;
            lesson.videoChannelId = bestVideo.snippet.channelId;
            lesson.videoChannelTitle = bestVideo.snippet.channelTitle;
            lesson.videoChangeCount += 1;
            lesson.videoHistory.push({ videoUrl: lesson.videoUrl, videoChannelId: lesson.videoChannelId, videoChannelTitle: bestVideo.snippet.channelTitle });
            
            await course.save();
            console.log(`[YouTube] Found new video ID: ${bestVideo.id.videoId}`);
            res.json(lesson);
        } else {
            console.warn('[YouTube] Could not find a new, unplayed video.');
            return res.status(404).json({ msgKey: 'errors.no_new_video_found' });
        }
    } catch (error) {
        console.error("Error changing lesson video:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.getChatHistory = async (req, res) => {
    console.log('[API] /chat/:courseId called');
    try {
        const chat = await Chat.findOne({
            course: req.params.courseId,
            user: req.user.id
        });

        if (!chat) {
            console.log('[DB] No chat history found for this course and user.');
            return res.json([]); // Return empty array if no history
        }

        console.log('[DB] Chat history retrieved successfully.');
        res.json(chat.messages);
    } catch (error) {
        console.error("Error fetching chat history:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.getChatbotResponse = async (req, res) => {
    console.log('[API] /chatbot called (with save logic)');
    const { courseId, userQuery, lessonContent, chatHistory } = req.body;
    const userId = req.user.id;

    try {
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        // --- Start of AI Prompt Generation (same as before) ---
        let fullPrompt = `You are an AI Tutor named TANISI for a course on "${course.topic}". A student has asked: "${userQuery}".`;
        
        if (chatHistory && chatHistory.length > 0) {
            const formattedHistory = chatHistory.map(msg => `${msg.isUser ? 'Student' : 'TANISI'}: ${msg.text}`).join('\n');
            fullPrompt += `\n\nHere is the previous conversation for context:\n<ChatHistory>\n${formattedHistory}\n</ChatHistory>`;
        }
        
        if (lessonContent) {
            fullPrompt += `\n\nThe current lesson content is as follows:\n<LessonContent>\n${lessonContent}\n</LessonContent>`;
        }
        
        fullPrompt += `\n\nProvide a helpful and detailed explanation based on the course topic and the provided lesson content. The response must be easy to read, well-structured, and use markdown formatting like headings, bullet points, and numbered lists where appropriate. If the question is outside the scope of "${course.topic}", gently decline to answer and guide the student back to the course material. The response must be in the ${course.languageName} language.`;

        console.log('[AI] Generating chatbot response with full context...');
        const rawText = await generateWithFallback(fullPrompt);
        console.log('[AI] Chatbot response generated.');
        // --- End of AI Prompt Generation ---

        // --- New Database Save Logic ---
        console.log('[DB] Saving chat messages to database...');
        const userMessage = { text: userQuery, isUser: true, timestamp: new Date() };
        const aiMessage = { text: rawText, isUser: false, timestamp: new Date() };

        // Find the chat document or create a new one if it doesn't exist
        await Chat.findOneAndUpdate(
            { course: courseId, user: userId },
            { $push: { messages: { $each: [userMessage, aiMessage] } } },
            { upsert: true, new: true }
        );
        console.log('[DB] Chat messages saved successfully.');
        // --- End of New Database Save Logic ---

        res.json({ response: rawText });
    } catch (error) {
        console.error("Error getting chatbot response:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.saveCourseNotes = async (req, res) => {
    console.log('[API] /notes/:courseId called');
    const { courseId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    try {
        const course = await Course.findOneAndUpdate(
            { _id: courseId, user: userId },
            { notes: notes },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        console.log('[DB] Notes saved successfully.');
        res.json({ msg: 'Notes saved successfully.', notes: course.notes });
    } catch (error) {
        console.error("Error saving notes:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.generateQuiz = async (req, res) => {
    console.log('[API] /quiz/generate called');
    const { courseId } = req.body;
    const userId = req.user.id;

    try {
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        if (course.quiz && course.quiz.length > 0) {
            console.log('[CACHE] Returning existing quiz.');
            return res.json(course.quiz);
        }

        const questionCount = (course.numSubtopics === 10 || course.numSubtopics === 15) ? 20 : 10;
        let allLessonContent = '';
        course.index.subtopics.forEach(subtopic => {
            subtopic.lessons.forEach(lesson => {
                allLessonContent += `Lesson: ${lesson.title}\nContent: ${lesson.content || ''}\n\n`;
            });
        });

        const prompt = `Based on the following course content for "${course.topic}", generate a multiple-choice quiz with ${questionCount} questions. Each question must have 4 options, and you must indicate the correct answer. IMPORTANT: Your response MUST be a valid JSON array of objects. Each object should have "question", "options" (an array of 4 strings), and "correctAnswer" (a string matching one of the options).

        Course Content:
        ${allLessonContent}`;

        console.log('[AI] Generating quiz...');
        const rawText = await generateWithFallback(prompt);
        const cleanedJsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let quiz;
        try {
            quiz = JSON.parse(cleanedJsonString);
        } catch (jsonParseError) {
            console.error("Error parsing AI generated quiz JSON:", jsonParseError);
            console.error("Malformed JSON string:", cleanedJsonString);
            return res.status(500).json({ msgKey: "errors.quiz_generation_failed_format" });
        }

        if (!Array.isArray(quiz) || quiz.length === 0 || !quiz.every(q => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctAnswer === 'string')) {
            console.error("AI generated quiz has invalid structure:", quiz);
            return res.status(500).json({ msgKey: "errors.quiz_generation_failed_structure" });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { $set: { quiz: quiz } },
            { new: true, runValidators: true, upsert: false }
        );

        if (!updatedCourse) {
            console.error('[DB] Failed to find and update course for quiz save.');
            return res.status(404).json({ msg: 'Course not found during quiz save.' });
        }

        console.log('[DB] Quiz saved to course.');

        res.json(quiz);
    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.completeQuiz = async (req, res) => {
    console.log('[API] /complete-quiz/:courseId called');
    const { courseId } = req.params;
    const { score, totalQuestions } = req.body;
    const userId = req.user.id;

    console.log(`[completeQuiz] Received data for course ${courseId}: score=${score}, totalQuestions=${totalQuestions}`);

    try {
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

        const updatedCourse = await Course.findOneAndUpdate(
            { _id: courseId, user: userId },
            {
                score: score,
                completionDate: new Date(),
                status: percentage >= 60 ? 'Completed' : 'Active'
            },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            console.log('[completeQuiz] Course not found or user unauthorized for update.');
            return res.status(404).json({ msg: 'Course not found or user unauthorized.' });
        }

        console.log(`[DB] Course ${courseId} quiz completed. Score: ${score}/${totalQuestions}, Percentage: ${percentage.toFixed(2)}%`);
        res.json({ message: 'Quiz score and completion date saved.', course: updatedCourse });

    } catch (error) {
        console.error("Error completing quiz:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.getUsersCourses = async (req, res) => {
    console.log('[API] /courses called');
    const userId = req.user.id;
    // --- THIS IS THE FIX ---
    // Add 'certified' to the list of variables extracted from req.query
    const { page = 1, limit = 20, search = '', sortBy = 'newest', status = 'all', certified } = req.query;

    const query = { user: userId };
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: {}
    };

    if (search) {
        query.topic = { $regex: search, $options: 'i' };
    }

    if (certified === 'true') {
        query.status = 'Completed';
        query.$expr = {
            $gte: [
                { $divide: ["$score", { $size: "$quiz" }] },
                0.60
            ]
        };
    } else if (status !== 'all') {
        query.status = status;
    }

    if (sortBy === 'newest') {
        options.sort.createdAt = -1;
    } else if (sortBy === 'oldest') {
        options.sort.createdAt = 1;
    }

    try {
        const courses = await Course.paginate(query, options);
        res.json(courses);
    } catch (error) {
        console.error("Error fetching user courses:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};

exports.exportCourseAsPdf = async (req, res) => {
    console.log('[API] /export/:courseId called');
    const { courseId } = req.params;
    const userId = req.user.id;

    try {
        const course = await Course.findOne({ _id: courseId, user: userId });
        if (!course) {
            return res.status(404).send('Course not found');
        }

        console.log('[PDF] Generating HTML content for PDF...');
        
        const objectiveList = Array.isArray(course.objective) 
            ? course.objective.map((obj, i) => `<li>${obj}</li>`).join('')
            : `<li>${course.objective}</li>`;

        const htmlContent = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', sans-serif;
                            margin: 0;
                            background-color: white;
                            color: black;
                            -webkit-print-color-adjust: exact;
                        }
                        .page {
                            padding: 100px 60px;
                        }
                        .cover-page {
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                        }
                        h1, h2, h3, a {
                            color: #03d9c5;
                            text-decoration: none;
                        }
                        h1 { font-size: 2.5em; }
                        h2 { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-top: 0; }
                        .page-break {
                            page-break-before: always;
                        }
                        ul {
                            list-style-type: none;
                            padding-left: 0;
                        }
                        li {
                            margin-bottom: 8px;
                            padding-left: 1rem;
                            border-left: 2px solid #03d9c5;
                        }
                    </style>
                </head>
                <body>
                    <div class="page cover-page">
                        <h1>${course.topic}</h1>
                    </div>

                    <div class="page-break"></div>

                    <div class="page">
                        <h2>Objective</h2>
                        <ul>${objectiveList}</ul>
                    </div>

                    <div class="page-break"></div>

                    <div class="page">
                        <h2>Outcome</h2>
                        <p>${(course.outcome || '').replace(/\n/g, '<br>')}</p>
                    </div>

                    <div class="page-break"></div>

                    <div class="page">
                        <h1>Course Index</h1>
                        ${course.index.subtopics.map(sub => `
                            <div>
                                <h3>${sub.title}</h3>
                                <ul>
                                    ${sub.lessons.map(lesson => `<li>${lesson.title}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>

                    ${course.index.subtopics.map(sub => sub.lessons.map(lesson => `
                        <div class="page-break"></div> <div class="page">
                            <h2>${lesson.title}</h2>
                            ${lesson.videoHistory && lesson.videoHistory.length > 0 ? `
                                ${lesson.videoHistory.map(video => `
                                    <p>Watch the video: <a href="${video.videoUrl}" target="_blank" rel="noopener noreferrer">${video.videoUrl}</a></p>
                                    <p>Credit: <a href="https://www.youtube.com/channel/${video.videoChannelId}" target="_blank" rel="noopener noreferrer">${video.videoChannelTitle}</a></p>
                                `).join('<br/>')}
                            ` : (lesson.videoUrl ? `
                                <p>Watch the video: <a href="${lesson.videoUrl}" target="_blank" rel="noopener noreferrer">${lesson.videoUrl}</a></p>
                                <p>Credit: <a href="https://www.youtube.com/channel/${lesson.videoChannelId}" target="_blank" rel="noopener noreferrer">${lesson.videoChannelTitle}</a></p>
                            ` : '')}
                            <div>${(lesson.content || '').replace(/\n/g, '<br>')}</div>
                        </div>
                    `).join('')).join('')}
                </body>
            </html>
        `;

        console.log('[PDF] Launching Puppeteer...');
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        console.log('[PDF] Generating PDF buffer...');
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 12px; font-family: 'Segoe UI', sans-serif; color: #03d9c5; padding-left: 60px; width: 100%; box-sizing: border-box; height: 100px; padding-top: 40px;">
                    SeekMyCourse AI Technologies Pvt Ltd
                </div>`,
            footerTemplate: `
                <div style="font-size: 10px; font-family: 'Segoe UI', sans-serif; width: 100%; text-align: center; color: #aaa; padding: 0 60px; box-sizing: border-box; height: 100px; padding-top: 40px;">
                    This course was generated with <a href="https://seekmycourse.com" style="color: #03d9c5; text-decoration: none;">SeekMYCOURSE</a>
                </div>`,
            margin: {
                top: '100px',
                bottom: '100px'
            }
        });

        await browser.close();
        console.log('[PDF] PDF generated. Sending to client.');

        const sanitizedTopic = course.topic.replace(/[^a-zA-Z0-9]/g, '_');
        res.setHeader('Content-Disposition', `attachment; filename=SeekMYCOURSE-${sanitizedTopic}.pdf`);
        res.contentType('application/pdf');
        res.send(pdf);

    } catch (error) {
        console.error("PDF Export Error:", error.message);
        res.status(500).send('Error generating PDF');
    }
};

exports.getVerificationData = async (req, res) => {
    try {
        const { courseId, userId } = req.params;
        const course = await Course.findById(courseId).populate('user', 'firstName lastName');

        if (!course || course.user._id.toString() !== userId) {
            return res.status(404).json({ msg: 'Certificate data not found or invalid.' });
        }

        const totalQuestions = course.quiz.length;
        const score = course.score || 0;
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
        
        // Use English versions with fallbacks for older courses
        const objectiveString = Array.isArray(course.englishObjective) && course.englishObjective.length > 0 
            ? course.englishObjective.join('\n') 
            : (Array.isArray(course.objective) ? course.objective.join('\n') : course.objective);

        const englishIndex = {
            subtopics: course.index.subtopics.map(sub => ({
                ...sub.toObject(),
                title: sub.englishTitle || sub.title,
                lessons: sub.lessons.map(lesson => ({
                    ...lesson.toObject(),
                    title: lesson.englishTitle || lesson.title
                }))
            }))
        };

        const verificationData = {
            user: {
                firstName: course.user.firstName,
                lastName: course.user.lastName,
            },
            course: {
                topic: course.englishTopic || course.topic,
                objective: objectiveString,
                outcome: course.englishOutcome || course.outcome,
                index: englishIndex, // Use the processed English index
                startDate: course.createdAt,
                completionDate: course.completionDate || new Date(),
                percentageScored: percentage.toFixed(2)
            }
        };

        res.json(verificationData);

    } catch (error) {
        console.error("Error fetching verification data:", error.message);
        res.status(500).json({ msgKey: "errors.generic" });
    }
};