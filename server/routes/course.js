// server/routes/course.js
const express = require('express');
const router = express.Router(); // CORRECTED LINE: Initialize router correctly
const auth = require('../middleware/auth'); 

const { 
    generateObjective,
    generateOutcome,
    generateIndex,
    refineTopic,
    refineLesson,
    getCourseById,
    generateLessonContent,
    changeLessonVideo,
    getChatbotResponse,
    saveCourseNotes,
    exportCourseAsPdf,
    generateQuiz,
    getVerificationData,
    completeQuiz,
    getUsersCourses // Import the new getUsersCourses function
} = require('../controllers/courseController');

// --- PUBLIC ROUTE ---
// This route allows anyone to verify a certificate without logging in.
router.get('/verify/:courseId/:userId', getVerificationData);


// --- PROTECTED ROUTES ---
// All routes below this line require a valid token to access.
router.post('/refine-topic', auth, refineTopic);
router.post('/refine-lesson', auth, refineLesson);
router.post('/generate-objective', auth, generateObjective);
router.post('/generate-outcome', auth, generateOutcome);
router.post('/generate-index', auth, generateIndex);
router.post('/lesson/generate', auth, generateLessonContent);
router.post('/lesson/change-video', auth, changeLessonVideo);
router.post('/chatbot', auth, getChatbotResponse);
router.put('/notes/:courseId', auth, saveCourseNotes);
router.get('/export/:courseId', auth, exportCourseAsPdf);
router.post('/quiz/generate', auth, generateQuiz);
router.put('/complete-quiz/:courseId', auth, completeQuiz);
router.get('/:courseId', auth, getCourseById);
router.get('/', auth, getUsersCourses); // New route to get all courses for the logged-in user with filters/pagination


module.exports = router;