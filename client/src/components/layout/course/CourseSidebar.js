// client/src/components/layout/course/CourseSidebar.js
import React, { useState } from 'react';
import styled, { css } from 'styled-components'; // Import css
import { NavLink, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiCheckCircle, FiPlayCircle, FiAward } from 'react-icons/fi';
import logo from '../../../assets/seekmycourse_logo.png';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../common/Modal';
import Preloader from '../../common/Preloader';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const SidebarContainer = styled.div`
  width: 360px;
  background-color: #1e1e2d;
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed; /* Keep fixed positioning */
  top: 0;
  z-index: 100;
  transition: all 0.3s ease-in-out; /* Smooth transition for all properties */

  ${({ $isRTL }) => $isRTL ? css`
    right: 0; /* Sidebar on the right in RTL */
    left: unset;
    border-right: none;
    border-left: 1px solid #444; /* Border on the left in RTL */
  ` : css`
    left: 0; /* Sidebar on the left in LTR */
    right: unset;
    border-right: 1px solid #444; /* Border on the right in LTR */
    border-left: none;
  `}
`;

const TopSection = styled.div`
  padding: 1.5rem;
  height: 80px;
  border-bottom: 1px solid #444;
`;

const Logo = styled.img`
  width: 160px;
`;

const ButtonContainer = styled.div`
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    border: 1px solid #555;
    background-color: #2a2a3e;
    color: #fff;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    
    &:hover {
        background-color: #3a3a4e;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const QuizButton = styled(ActionButton)`
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.background};
    border-color: ${({ theme }) => theme.colors.primary};
    font-weight: bold;

    &:hover {
        background-color: #03c4b0;
    }
`;

const ProgressBarContainer = styled.div`
    width: calc(100% - 3rem); /* Full width minus padding */
    height: 10px;
    background-color: #33333d;
    border-radius: 5px;
    margin: 0.5rem 1.5rem 1rem; /* Adjust margin to fit above buttons */
    overflow: hidden;
`;

const ProgressBarFill = styled.div`
    height: 100%;
    width: ${({ $percentage }) => $percentage}%;
    background-color: ${({ theme }) => theme.colors.primary};
    border-radius: 5px;
    transition: width 0.5s ease-in-out;
`;

const ProgressText = styled.p`
    text-align: center;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
`;

const IndexList = styled.ul`
  list-style: none;
  padding: 0 1.5rem;
  margin: 0;
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Hide horizontal overflow */
  word-break: break-word; /* Allow long words to break and wrap */
  
  // Explicitly set direction and text-align for list items in RTL
  ${({ $isRTL }) => $isRTL && css`
    direction: rtl;
    text-align: right;
  `}

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #2a2a3e;
  }
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const SubtopicTitle = styled.h4`
    color: ${({ theme }) => theme.colors.primary};
    margin: 1.5rem 0 0.5rem;
    font-size: 1rem;
    ${({ $isRTL }) => $isRTL && css`
      direction: rtl;
      text-align: right;
    `}
`;

const LessonLink = styled(NavLink)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #a0a0a0;
    text-decoration: none;
    padding: 0.6rem 1rem;
    border-radius: 6px;
    
    // Ensure text aligns correctly within the link for RTL
    ${({ $isRTL }) => $isRTL && css`
      direction: rtl;
      text-align: right;
      // Reverse order of icon and text if icon is present
      flex-direction: row-reverse;
      span {
        margin-left: 0.5rem; /* Space between text and icon */
        margin-right: 0;
      }
    `}

    &.completed {
        color: #6a9955;
    }

    &:hover {
        background-color: #2a2a3e;
        color: white;
    }

    &.active {
        background-color: ${({ theme }) => theme.colors.primary};
        color: #1e1e2d;
        font-weight: 600;
    }
`;

const CourseSidebar = ({ course, isRTL }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    let completedLessonsCount = 0;
    let totalLessonsCount = 0;

    if (course && course.index && course.index.subtopics) {
        course.index.subtopics.forEach(subtopic => {
            subtopic.lessons.forEach(lesson => {
                totalLessonsCount++;
                if (lesson.isCompleted) {
                    completedLessonsCount++;
                }
            });
        });
    }

    const completionPercentage = totalLessonsCount > 0
        ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
        : 0;

    const isCourseFullyComplete = completionPercentage === 100;

    const hasQuizBeenTakenAndPassed = () => {
        if (!course || course.score === undefined || !course.quiz || course.quiz.length === 0) {
            return false;
        }
        const percentage = (course.score / course.quiz.length) * 100;
        return percentage >= 60;
    };

    const handleExportPDF = async () => {
        if (!isCourseFullyComplete) {
            setShowModal(true);
            return;
        }

        setIsExporting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/course/export/${course._id}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const sanitizedTopic = course.topic.replace(/[^a-zA-Z0-9]/g, '_');
            link.setAttribute('download', `SeekMYCOURSE-Course-${sanitizedTopic}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert(t('errors.export_pdf_failed', { defaultValue: 'Could not export PDF. Please try again later.' }));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {isExporting && <Preloader />}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('course_not_complete_title', { defaultValue: 'Course Not Complete' })}>
                <ModalText>{t('course_not_complete_message', { defaultValue: 'Please complete all lessons before exporting the course as a PDF.' })}</ModalText>
                <ModalButtonContainer>
                    <ModalButton primary onClick={() => setShowModal(false)}>{t('course_generation.ok_button')}</ModalButton>
                </ModalButtonContainer>
            </Modal>

            <SidebarContainer $isRTL={isRTL}> {/* Pass isRTL as transient prop */}
                <TopSection>
                    <Logo src={logo} alt="SeekMYCOURSE Logo" />
                </TopSection>
                <ProgressText>{t('course_progress_text', { defaultValue: 'Course Progress' })}: {completionPercentage}%</ProgressText>
                <ProgressBarContainer>
                    <ProgressBarFill $percentage={completionPercentage} />
                </ProgressBarContainer>
                <ButtonContainer>
                    <ActionButton onClick={() => navigate('/dashboard')}>
                        <FiArrowLeft /> {t('back_to_home_button', { defaultValue: 'Back to Home' })}
                    </ActionButton>
                    <ActionButton onClick={handleExportPDF} disabled={!isCourseFullyComplete}>
                        <FiDownload /> {t('export_pdf_button', { defaultValue: 'Export Course as PDF' })}
                    </ActionButton>
                    
                    {isCourseFullyComplete && !hasQuizBeenTakenAndPassed() && (
                        <QuizButton onClick={() => navigate(`/course/${course._id}/quiz`)}>
                            <FiPlayCircle /> {t('take_quiz_button', { defaultValue: 'Take Quiz' })}
                        </QuizButton>
                    )}
                    {isCourseFullyComplete && hasQuizBeenTakenAndPassed() && (
                        <QuizButton onClick={() => navigate(`/course/${course._id}/certificate`)}>
                            <FiAward /> {t('get_certificate_button', { defaultValue: 'Get Certificate' })}
                        </QuizButton>
                    )}
                </ButtonContainer>
                <IndexList $isRTL={isRTL}> {/* Pass isRTL here */}
                    {course?.index?.subtopics.map((subtopic, sIndex) => (
                        <div key={subtopic._id || sIndex}>
                            <SubtopicTitle $isRTL={isRTL}>
                                {sIndex + 1}. {subtopic.title} {subtopic.englishTitle && `(${subtopic.englishTitle})`}
                            </SubtopicTitle>
                            <ul>
                                {subtopic.lessons.map((lesson, lIndex) => (
                                    <li key={lesson._id || lIndex}>
                                        <LessonLink
                                            to={`/course/${course._id}/lesson/${subtopic._id}/${lesson._id}`}
                                            className={lesson.isCompleted ? 'completed' : ''}
                                            $isRTL={isRTL} // Pass isRTL here
                                        >
                                            <span>
                                                {sIndex + 1}.{lIndex + 1} {lesson.title} {lesson.englishTitle && `(${lesson.englishTitle})`}
                                            </span>
                                            {lesson.isCompleted && <FiCheckCircle />}
                                        </LessonLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </IndexList>
            </SidebarContainer>
        </>
    );
};

export default CourseSidebar;