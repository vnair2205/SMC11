// client/src/components/layout/course/CourseSidebar.js
import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiDownload, FiCheckCircle, FiPlayCircle, FiAward, FiHome } from 'react-icons/fi';
import logo from '../../../assets/seekmycourse_logo.png';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../common/Modal';
import Preloader from '../../common/Preloader';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Define widths for consistency
const expandedWidth = '300px';

const SidebarContainer = styled.div`
  width: ${expandedWidth};
  background-color: #1e1e2d;
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease-in-out;

  ${({ $isRTL }) => $isRTL ? css`
    right: 0;
    left: unset;
    border-right: none;
    border-left: 1px solid #444;
  ` : css`
    left: 0;
    right: unset;
    border-right: 1px solid #444;
    border-left: none;
  `}
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #444;

  img {
    height: 40px;
    margin-right: 1rem;
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const SidebarNav = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem 0;
`;

const ProgressBar = styled.div`
  margin: 0 1rem 1rem;
  height: 8px;
  background-color: #444;
  border-radius: 4px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $progress }) => $progress}%;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
`;

const ProgressLabel = styled.div`
  margin: 0 1rem 1rem;
  text-align: ${({ dir }) => (dir === 'rtl' ? 'left' : 'right')};
  font-size: 0.9rem;
  color: #a0a0a0;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap; 
  width: calc(100% - 2rem);
  margin: 0 1rem 1rem;
  background-color: ${({ primary, theme }) => (primary ? theme.colors.primary : '#555')};
  color: ${({ primary, theme }) => (primary ? theme.colors.background : 'white')};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme, primary }) => (primary ? '#03a092' : '#777')}; 
  }
  &:disabled {
    background-color: #444;
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const NavLinkButton = styled(NavLink)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap; 
  width: calc(100% - 2rem);
  margin: 0 1rem 1rem;
  text-decoration: none;
  background-color: ${({ primary, theme }) => (primary ? theme.colors.primary : '#555')};
  color: ${({ primary, theme }) => (primary ? theme.colors.background : 'white')};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme, primary }) => (primary ? '#03a092' : '#777')}; 
  }
  &:disabled {
    background-color: #555;
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const IndexList = styled.div`
  padding: 0 1rem;
  font-size: 0.9rem;
  
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin-bottom: 0.5rem;
  }
`;

const SubtopicTitle = styled.h4`
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 0.5rem;
    margin-top: 1rem;
    white-space: normal;
    overflow-wrap: break-word;

    ${({ $isRTL }) => $isRTL && css`
        text-align: right;
    `}
`;

const LessonLink = styled(NavLink)`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #a0a0a0;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #33333d;
  }
  &.active {
    background-color: #33333d;
    color: #fff;
    font-weight: bold;
  }
  &.completed {
    color: ${({ theme }) => theme.colors.primary};
  }

  span {
    flex-grow: 1;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  ${({ $isRTL }) => $isRTL && css`
    flex-direction: row-reverse;
  `}
`;


const CourseSidebar = ({ course, isRTL }) => {
    const navigate = useNavigate();
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false); // NEW: State for the quiz instruction modal
    const { t } = useTranslation();

    const totalLessons = course?.index?.subtopics.reduce((acc, sub) => acc + sub.lessons.length, 0) || 0;
    const completedLessons = course?.index?.subtopics.reduce((acc, sub) => acc + sub.lessons.filter(l => l.isCompleted).length, 0) || 0;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isCompletedAndPassed = course?.status === 'Completed' && course?.score !== undefined && course?.quiz?.length > 0 && (course.score / course.quiz.length) * 100 >= 60;
    const isCompleted100Percent = progress === 100;

    const handleExportPdf = async () => {
        if (!isCompleted100Percent) {
            setErrorModal({ isOpen: true, message: t('errors.course_not_completed_export') || "Please complete all lessons before exporting the course to PDF." });
            return;
        }

        setExportLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/course/export/${course._id}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });
            const fileURL = URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = fileURL;
            const sanitizedTopic = course.topic.replace(/[^a-zA-Z0-9]/g, '_');
            link.download = `SeekMYCOURSE-${sanitizedTopic}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
        } catch (err) {
            console.error('Failed to export PDF:', err);
            setErrorModal({ isOpen: true, message: t(err.response?.data?.msgKey || 'errors.generic') });
        } finally {
            setExportLoading(false);
        }
    };
    
    const handleDownloadCertificate = () => {
        if (!isCompletedAndPassed) {
            setErrorModal({ isOpen: true, message: t('errors.course_not_completed_certificate', { defaultValue: 'You must complete the course and pass the quiz to get a certificate.' }) });
            return;
        }
        navigate(`/course/${course._id}/certificate`);
    };
    const handleTakeQuiz = () => {
         setIsQuizModalOpen(true);
    };

const startQuiz = () => {
        setIsQuizModalOpen(false);
        navigate(`/course/${course._id}/quiz`);
    };
    

    return (
        <>
            <Modal isOpen={errorModal.isOpen} onClose={() => setErrorModal({ isOpen: false, message: '' })} title={t('course_generation.info_modal_title')}>
                <ModalText>{errorModal.message}</ModalText>
                <ModalButtonContainer>
                    <ModalButton primary onClick={() => setErrorModal({ isOpen: false, message: '' })}>{t('course_generation.ok_button')}</ModalButton>
                </ModalButtonContainer>
            </Modal>
            {/* --- NEW QUIZ INSTRUCTION MODAL --- */}
            <Modal
                isOpen={isQuizModalOpen}
                onClose={() => setIsQuizModalOpen(false)}
                title={t('quiz.instruction_modal_title', { defaultValue: 'Quiz Instructions' })}
            >
                <ModalText style={{ textAlign: 'left', lineHeight: 1.8 }}>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li>{t('quiz.instruction_passing_score', { defaultValue: 'You must score 60% or more to earn a certificate.' })}</li>
                        <li>{t('quiz.instruction_how_to', { defaultValue: "Select an answer and click 'Next Question' to proceed." })}</li>
                        <li>{t('quiz.instruction_feedback', { defaultValue: 'Correct answers will be highlighted in green and incorrect ones in red.' })}</li>
                    </ul>
                </ModalText>
                <ModalButtonContainer>
                    <ModalButton onClick={() => setIsQuizModalOpen(false)}>{t('errors.cancel_button', { defaultValue: 'Cancel' })}</ModalButton>
                    <ModalButton primary onClick={startQuiz}>{t('quiz.start_quiz_button', { defaultValue: 'Start Quiz' })}</ModalButton>
                </ModalButtonContainer>
            </Modal>


            <SidebarContainer $isRTL={isRTL}>
                <SidebarHeader>
                    <img src={logo} alt="SeekMyCourse Logo" />
                    <h3>
                        {course?.topic}
                    </h3>
                </SidebarHeader>
                <SidebarNav>
                    <ProgressBar>
                        <ProgressFill $progress={progress} />
                    </ProgressBar>
                    <ProgressLabel dir={isRTL ? 'rtl' : 'ltr'}>
                        {t('course_generation.course_completion_label', {
                            completed: completedLessons,
                            total: totalLessons,
                            percentage: progress
                        })}
                    </ProgressLabel>
                    
                    <NavLinkButton to="/dashboard">
                        <FiHome /> {t('course_generation.back_to_home_button_text', { defaultValue: 'Back to Home' })}
                    </NavLinkButton>

                    <ActionButton onClick={handleExportPdf} disabled={exportLoading || !isCompleted100Percent}>
                        {exportLoading ? '...' : t('course_generation.export_course_to_pdf', { defaultValue: 'Export to PDF' })} <FiDownload />
                    </ActionButton>

                    {isCompletedAndPassed ? (
                        <ActionButton onClick={handleDownloadCertificate} disabled={downloadLoading}>
                            {t('sidebar.certificate_button', { defaultValue: 'Get Certificate' })} <FiAward />
                        </ActionButton>
                    ) : (
                        <ActionButton onClick={handleTakeQuiz} disabled={!isCompleted100Percent}>
                            {t('course_generation.take_quiz_button_text', { defaultValue: 'Take Quiz' })} <FiPlayCircle />
                        </ActionButton>
                    )}
                    
                    <IndexList $isRTL={isRTL}>
                        {course?.index?.subtopics.map((subtopic, sIndex) => (
                            <div key={subtopic._id || sIndex}>
                                <SubtopicTitle $isRTL={isRTL}>
                                    {course?.language === 'en' ? `${sIndex + 1}. ${subtopic.title}` : `${sIndex + 1}. ${subtopic.title} (${subtopic.englishTitle})`}
                                </SubtopicTitle>
                                <ul>
                                    {subtopic.lessons.map((lesson, lIndex) => (
                                        <li key={lesson._id || lIndex}>
                                            <LessonLink
                                                to={`/course/${course._id}/lesson/${subtopic._id}/${lesson._id}`}
                                                className={lesson.isCompleted ? 'completed' : ''}
                                                $isRTL={isRTL}
                                            >
                                                <span>
                                                    {course?.language === 'en' ? `${sIndex + 1}.${lIndex + 1} ${lesson.title}` : `${sIndex + 1}.${lIndex + 1} ${lesson.title} (${lesson.englishTitle})`}
                                                </span>
                                                {lesson.isCompleted && <FiCheckCircle />}
                                            </LessonLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </IndexList>
                </SidebarNav>
            </SidebarContainer>
        </>
    );
};

export default CourseSidebar;