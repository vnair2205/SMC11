// client/src/pages/dashboard/CourseViewPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Preloader from '../../components/common/Preloader';
import CourseLayout from '../../components/layout/course/CourseLayout';
import { useTranslation } from 'react-i18next';

const CourseViewPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0); // New state to trigger refresh

    // Function to trigger a refresh of course data
    const refreshCourseData = () => {
        console.log('[CourseViewPage] Refresh triggered by child!');
        setRefreshTrigger(prev => prev + 1); // Increment to trigger useEffect
    };

    // Fetch course data when component mounts, courseId changes, or refreshTrigger changes
    useEffect(() => {
        const fetchCourseDetails = async () => {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.get(`/api/course/${courseId}`, config);
                setCourse(res.data);
            } catch (err) {
                console.error("Error fetching course details:", err.response ? err.response.data : err.message);
                setError(t(err.response?.data?.msgKey || 'errors.generic'));
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId, navigate, t, refreshTrigger]); // Add refreshTrigger to dependencies

    // Determine if the course is completed and passed for conditional UI (e.g., chatbot access)
    const courseCompletedAndPassed = course && course.status === 'Completed' && course.score !== undefined && course.quiz && course.quiz.length > 0 && (course.score / course.quiz.length) * 100 >= 60;


    if (loading) {
        return <Preloader />;
    }

    if (error) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;
    }

    if (!course) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Course not found or no data available.</div>;
    }

    // Render the CourseLayout and pass the fetched course object and completion status
    return (
        <CourseLayout course={course} courseCompletedAndPassed={courseCompletedAndPassed}>
            {/* Pass refreshCourseData, course, and courseCompletedAndPassed via Outlet context */}
            <Outlet context={{ refreshCourseData, course, courseCompletedAndPassed }} />
        </CourseLayout>
    );
};

export default CourseViewPage;