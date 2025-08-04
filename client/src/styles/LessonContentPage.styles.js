import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Outlet, useLocation, useNavigate, useOutletContext, Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import DOMPurify from 'dompurify';
import Preloader from '../../components/common/Preloader';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../components/common/Modal';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

const LessonWrapper = styled.div`
    padding: 1rem;
`;

const VideoContainer = styled.div`
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    margin-bottom: 1.5rem;
    border-radius: 12px;
    background-color: #000; /* Ensures a black background for unavailable video message */
    
    & > iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 0;
    }
`;

const NoVideoPlaceholder = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #33333d;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a0a0a0;
    font-style: italic;
    font-size: 1.2rem;
    padding: 1rem;
`;

const VideoControls = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
`;

const CreditLink = styled.a`
    font-style: italic;
    color: ${({ theme }) => theme.colors.textSecondary};
    &:hover {
        color: ${({ theme }) => theme.colors.primary};
    }
`;

const ChangeVideoButton = styled.button`
    padding: 0.5rem 1rem;
    border: 1px solid ${({ theme }) => theme.colors.primary};
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border-radius: 6px;
    cursor: pointer;
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const NavButton = styled.button`
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;

const VideoNav = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const ContentBody = styled.div`
    line-height: 1.8;
    white-space: pre-wrap;
    font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
    color: ${({ theme }) => theme.colors.error};
    text-align: center;
    margin-top: 2rem;
    font-size: 1.2rem;
`;

const PageContainer = styled.div`
  padding: 2rem;
  text-align: ${({ dir }) => (dir === 'rtl' ? 'right' : 'left')};
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 1.5rem;
  font-size: 2.5rem;
`;

const LessonContentPage = () => {
    const { courseId, subtopicId, lessonId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { refreshCourseData, course: parentCourse, courseCompletedAndPassed } = useOutletContext();

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [videoHistory, setVideoHistory] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
    const [videoChangeCount, setVideoChangeCount] = useState(0);
    const [quizAvailabilityModal, setQuizAvailabilityModal] = useState({ isOpen: false, message: '' });

    const isGeneratingRef = useRef(false);

    const isRTL = ['ar', 'ur'].includes(parentCourse?.language);
    const isEnglishCourse = parentCourse?.language === 'en';

    const getYouTubeEmbedUrl = (videoId) => {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    };

    const fetchCourseData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            if (!parentCourse) {
                return;
            }

            const currentSubtopic = parentCourse.index?.subtopics.find(sub => sub._id === subtopicId);
            const currentLessonFromParent = currentSubtopic ? currentSubtopic.lessons.find(l => l._id === lessonId) : null;

            if (!currentSubtopic || !currentLessonFromParent) {
                setError(t('errors.content_not_found'));
                setLoading(false);
                return;
            }

            setLesson(currentLessonFromParent);
            setVideoHistory(currentLessonFromParent.videoHistory || (currentLessonFromParent.videoUrl ? [{ videoUrl: currentLessonFromParent.videoUrl, videoChannelId: currentLessonFromParent.videoChannelId, videoChannelTitle: currentLessonFromParent.videoChannelTitle }] : []));
            setCurrentVideoIndex((currentLessonFromParent.videoHistory?.length || 0) > 0 ? currentLessonFromParent.videoHistory.length - 1 : (currentLessonFromParent.videoUrl ? 0 : -1));
            setVideoChangeCount(currentLessonFromParent.videoChangeCount || 0);

            if (currentLessonFromParent.isCompleted && currentLessonFromParent.content && currentLessonFromParent.videoUrl) {
                setLoading(false);
                return;
            }

            if (isGeneratingRef.current) {
                console.log(`[LessonContentPage] Skipping API call because another is in progress.`);
                return;
            }

            isGeneratingRef.current = true;
            
            try {
                const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token }};
                const body = JSON.stringify({ courseId, subtopicId, lessonId });
                
                console.log(`[LessonContentPage] Calling API /api/course/lesson/generate for lesson: ${lessonId}`);
                const res = await axios.post('/api/course/lesson/generate', body, config);
                
                const updatedLesson = res.data;
                const wasCompletedBefore = currentLessonFromParent?.isCompleted || false;

                setLesson(updatedLesson);
                const history = updatedLesson.videoHistory && updatedLesson.videoHistory.length > 0
                    ? updatedLesson.videoHistory
                    : (updatedLesson.videoUrl ? [{ videoUrl: updatedLesson.videoUrl, videoChannelId: updatedLesson.videoChannelId, videoChannelTitle: updatedLesson.videoChannelTitle }] : []);
                
                setVideoHistory(history);
                setCurrentVideoIndex(history.length - 1);
                setVideoChangeCount(updatedLesson.videoChangeCount || 0);

                if (updatedLesson.isCompleted && !wasCompletedBefore) {
                    refreshCourseData();
                }

            } catch (err) {
                console.error("[LessonContentPage] Error generating lesson content:", err.response?.data || err.message);
                const errorMsg = t(err.response?.data?.msgKey || 'errors.generic');
                setError(errorMsg);
            } finally {
                setLoading(false);
                isGeneratingRef.current = false;
            }
        } catch (err) {
            console.error("[LessonContentPage] Error fetching course data initially:", err);
            setError(t('errors.failed_to_load_content'));
            setLoading(false);
        }
    }, [courseId, subtopicId, lessonId, navigate, refreshCourseData, parentCourse, t]);

    useEffect(() => {
        if (parentCourse) {
            fetchCourseData();
        }
    }, [fetchCourseData, parentCourse]);

    const handleChangeVideo = async () => {
        setShowModal(false);
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token }};
            const body = JSON.stringify({ courseId, subtopicId, lessonId });
            const res = await axios.post('/api/course/lesson/change-video', body, config);
            
            const updatedLesson = res.data;
            setLesson(updatedLesson);
            setVideoHistory(updatedLesson.videoHistory);
            setCurrentVideoIndex(updatedLesson.videoHistory.length - 1);
            setVideoChangeCount(updatedLesson.videoChangeCount);

            refreshCourseData();

        } catch (err) {
            console.error(err);
            setError(t(err.response?.data?.msgKey || 'errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    const handlePrevVideo = () => {
        if (currentVideoIndex > 0) {
            setCurrentVideoIndex(currentVideoIndex - 1);
        }
    };

    const handleNextVideo = () => {
        if (currentVideoIndex < videoHistory.length - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    if (loading || !parentCourse) {
        return <Preloader />;
    }

    if (error) {
        return <ErrorMessage>{error}</ErrorMessage>;
    }

    const currentSubtopic = parentCourse.index?.subtopics.find(sub => sub._id === subtopicId);

    if (!lesson || !currentSubtopic || !parentCourse) {
        return <ErrorMessage>{t('errors.content_not_found')}</ErrorMessage>;
    }
    
    const videoId = videoHistory[currentVideoIndex]?.videoUrl?.split('v=')[1];

    return (
        <PageContainer dir={isRTL ? 'rtl' : 'ltr'}>
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('change_video_modal_title', { defaultValue: 'Change Video' })}>
                <ModalText>{t('change_video_modal_message', { defaultValue: 'You can change the video for this lesson up to 3 times.' })}</ModalText>
                <ModalButtonContainer>
                    <ModalButton onClick={() => setShowModal(false)}>{t('course_generation.cancel_button')}</ModalButton>
                    <ModalButton primary onClick={handleChangeVideo}>{t('change_video_button', { defaultValue: 'Change' })}</ModalButton>
                </ModalButtonContainer>
            </Modal>
            
            <Title>
                {isEnglishCourse ?
                    `${currentSubtopic.title} - ${lesson.title}`
                :
                    `${currentSubtopic.title} ${currentSubtopic.englishTitle && `(${currentSubtopic.englishTitle})`} - ${lesson.title} ${lesson.englishTitle && `(${lesson.englishTitle})`}`
                }
            </Title>
            
            <VideoContainer>
                {videoId ? (
                    <iframe
                        key={videoId}
                        src={getYouTubeEmbedUrl(videoId)}
                        title={lesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen>
                    </iframe>
                ) : (
                    <NoVideoPlaceholder>
                        {t('errors.no_suitable_video_found_placeholder')}
                    </NoVideoPlaceholder>
                )}
            </VideoContainer>

            <VideoControls>
                {videoHistory[currentVideoIndex]?.videoChannelId && (
                    <CreditLink href={`https://www.youtube.com/channel/${videoHistory[currentVideoIndex].videoChannelId}`} target="_blank" rel="noopener noreferrer">
                        {t('video_credit_label', { defaultValue: 'Credit' })}: {videoHistory[currentVideoIndex].videoChannelTitle}
                    </CreditLink>
                )}
                <VideoNav>
                    <NavButton onClick={handlePrevVideo} disabled={currentVideoIndex <= 0}>
                        <FiChevronLeft />
                    </NavButton>
                    <NavButton onClick={handleNextVideo} disabled={currentVideoIndex >= videoHistory.length - 1}>
                        <FiChevronRight />
                    </NavButton>
                    <ChangeVideoButton onClick={() => setShowModal(true)} disabled={videoChangeCount >= 3 || courseCompletedAndPassed}>
                        {t('change_video_button_text', { defaultValue: 'Change Video' })} ({3 - videoChangeCount} {t('change_video_button_remaining', { defaultValue: 'left' })})
                    </ChangeVideoButton>
                </VideoNav>
            </VideoControls>

            <ContentBody dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content || t('course_generation.loading_text')) }} />
            
            {/* The Notes and Chatbot components will be placed here */}

        </PageContainer>
    );
};

export default LessonContentPage;