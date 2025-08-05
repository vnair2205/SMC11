const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
    generateObjective,
    generateOutcome,
    generateIndex,
    refineTopic,
    refineLesson,
    refineSingleObjective,
    getCourseById,
    generateLessonContent,
    changeLessonVideo,
    getChatbotResponse, // This will now also save the chat
    getChatHistory,      // New function to get history
    saveCourseNotes,
    exportCourseAsPdf,
    generateQuiz,
    getVerificationData,
    completeQuiz,
    getUsersCourses
} = require('../controllers/courseController');

// --- PUBLIC ROUTE ---
router.get('/verify/:courseId/:userId', getVerificationData);


// --- PROTECTED ROUTES ---
// All routes below this line require a valid token to access.
router.post('/refine-topic', auth, refineTopic);
router.post('/refine-lesson', auth, refineLesson);
router.post('/refine-objective', auth, refineSingleObjective);
router.post('/generate-objective', auth, generateObjective);
router.post('/generate-outcome', auth, generateOutcome);
router.post('/generate-index', auth, generateIndex);
router.post('/lesson/generate', auth, generateLessonContent);
router.post('/lesson/change-video', auth, changeLessonVideo);
router.put('/notes/:courseId', auth, saveCourseNotes);
router.get('/export/:courseId', auth, exportCourseAsPdf);
router.post('/quiz/generate', auth, generateQuiz);
router.put('/complete-quiz/:courseId', auth, completeQuiz);
router.get('/:courseId', auth, getCourseById);
router.get('/', auth, getUsersCourses);

// --- NEW AND MODIFIED CHAT ROUTES ---
router.get('/chat/:courseId', auth, getChatHistory); // New route to get chat history
router.post('/chatbot', auth, getChatbotResponse); // This existing route will be updated to save messages

module.exports = router;