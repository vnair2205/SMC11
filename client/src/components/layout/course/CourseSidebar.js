// client/src/components/layout/course/CourseSidebar.js
import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiCheckCircle, FiPlayCircle, FiAward } from 'react-icons/fi';
import logo from '../../../assets/seekmycourse_logo.png';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../common/Modal';
import Preloader from '../../common/Preloader';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Define widths for consistency (should match Sidebar.js if they are the same sidebar)
const expandedWidth = '300px'; 
const collapsedWidth = '88px'; // Not directly used here, but good for context

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
  text-align: right;
  font-size: 0.9rem;
  color: #a0a0a0;
`;

const DownloadButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: #1e1e2d;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  width: calc(100% - 2rem);
  margin: 0 1rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  &:disabled {
    background-color: #555;
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

    ${({ $isRTL }) => $isRTL && css`
        text-align: right;
    `}
`;

const LessonLink = styled(NavLink)`
  display: flex;
  align-items: center;
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
    color: ${({ theme }) => theme.colors.success};
  }

  span {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ${({ $isRTL }) => $isRTL && css`
    flex-direction: row-reverse;
  `}
`;

const CourseSidebar = ({ course, isRTL }) => {
    const navigate = useNavigate();
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const { t } = useTranslation();

    const totalLessons = course?.index?.subtopics.reduce((acc, sub) => acc + sub.lessons.length, 0) || 0;
    const completedLessons = course?.index?.subtopics.reduce((acc, sub) => acc + sub.lessons.filter(l => l.isCompleted).length, 0) || 0;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const isCompleted = progress === 100;
    const isEnglishCourse = course?.language === 'en';

    const handleDownloadCertificate = async () => {
        if (!isCompleted) {
            setErrorModal({ isOpen: true, message: t('errors.course_not_completed_certificate') });
            return;
        }

        setDownloadLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/course/certificate/${course._id}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            const fileURL = URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = `${course.title.replace(/\s/g, '_')}_Certificate.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(fileURL);
        } catch (err) {
            console.error('Failed to download certificate:', err);
            setErrorModal({ isOpen: true, message: t(err.response?.data?.msgKey || 'errors.failed_to_download_certificate') });
        } finally {
            setDownloadLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={errorModal.isOpen} onClose={() => setErrorModal({ isOpen: false, message: '' })} title={t('errors.title')}>
                <ModalText>{errorModal.message}</ModalText>
                <ModalButtonContainer>
                    <ModalButton primary onClick={() => setErrorModal({ isOpen: false, message: '' })}>{t('errors.ok_button')}</ModalButton>
                </ModalButtonContainer>
            </Modal>

            <SidebarContainer $isRTL={isRTL}>
                <SidebarHeader>
                    <NavButton onClick={() => navigate('/dashboard')}>
                        <FiArrowLeft size={24} />
                    </NavButton>
                    <img src={logo} alt="SeekMyCourse Logo" />
                    <h3>
                        {isEnglishCourse ? course?.title : `${course?.title} (${course?.englishTopic})`}
                    </h3>
                </SidebarHeader>
                <SidebarNav>
                    <ProgressBar>
                        <ProgressFill $progress={progress} />
                    </ProgressBar>
                    <ProgressLabel>{t('course_generation.progress_label')}: {completedLessons}/{totalLessons}</ProgressLabel>
                    
                    <DownloadButton onClick={handleDownloadCertificate} disabled={downloadLoading || !isCompleted}>
                        {downloadLoading ? <Preloader style={{ backgroundColor: 'transparent' }} /> : (
                            <>
                                {t('course_generation.download_certificate_button')} {isCompleted && <FiAward />}
                            </>
                        )}
                    </DownloadButton>

                    <IndexList $isRTL={isRTL}>
                        {course?.index?.subtopics.map((subtopic, sIndex) => (
                            <div key={subtopic._id || sIndex}>
                                <SubtopicTitle $isRTL={isRTL}>
                                    {isEnglishCourse ? `${sIndex + 1}. ${subtopic.title}` : `${sIndex + 1}. ${subtopic.title} (${subtopic.englishTitle})`}
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
                                                    {isEnglishCourse ? `${sIndex + 1}.${lIndex + 1} ${lesson.title}` : `${sIndex + 1}.${lIndex + 1} ${lesson.title} (${lesson.englishTitle})`}
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