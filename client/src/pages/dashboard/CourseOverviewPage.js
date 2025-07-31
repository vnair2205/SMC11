// SMC3/client/src/pages/dashboard/CourseOverviewPage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import Preloader from '../../components/common/Preloader';

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: calc(100vh - 100px);
`;

const CourseDetailCard = styled.div`
  background-color: #1e1e2d;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  margin: 0 auto;
`;

const CourseTitle = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
  text-align: center;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #33333d;
`;

const DetailLabel = styled.strong`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1rem;
`;

const DetailValue = styled.span`
  color: white;
  font-size: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
`;

const IndexList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1rem;
`;

const SubtopicItem = styled.li`
  margin-bottom: 1rem;
  h4 {
    color: white;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  ul {
    list-style: disc;
    margin-left: 1.5rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ActionButton = styled.button`
  display: block;
  width: fit-content;
  margin: 2rem auto 0;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const CourseOverviewPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
    }, [courseId, navigate, t]);

    if (loading) {
        return <Preloader />;
    }

    if (error) {
        return <PageContainer style={{ textAlign: 'center', color: 'red' }}>{error}</PageContainer>;
    }

    if (!course) {
        return <PageContainer style={{ textAlign: 'center' }}>{t('sidebar.no_courses_found')}</PageContainer>;
    }

    // Safely get the first lesson's ID
    const firstLessonId = course.index?.subtopics?.[0]?.lessons?.[0]?._id;

    return (
        <PageContainer>
            <CourseDetailCard>
                <CourseTitle>{course.topic}</CourseTitle>
                <DetailRow>
                    <DetailLabel>{t('sidebar.created_on')}:</DetailLabel>
                    <DetailValue>{format(new Date(course.createdAt), 'dd/MM/yyyy')}</DetailValue>
                </DetailRow>
                <DetailRow>
                    <DetailLabel>{t('sidebar.course_completion_date')}:</DetailLabel>
                    <DetailValue>{course.completionDate ? format(new Date(course.completionDate), 'dd/MM/yyyy') : t('sidebar.not_completed')}</DetailValue>
                </DetailRow>
                <DetailRow>
                    <DetailLabel>{t('sidebar.language')}:</DetailLabel>
                    <DetailValue>{course.languageName}</DetailValue>
                </DetailRow>
                <DetailRow>
                    <DetailLabel>{t('sidebar.subtopics')}:</DetailLabel>
                    <DetailValue>{course.numSubtopics}</DetailValue>
                </DetailRow>
                <DetailRow style={{ borderBottom: 'none' }}>
                    <DetailLabel>{t('sidebar.course_status')}:</DetailLabel>
                    <DetailValue>{course.status}</DetailValue>
                </DetailRow>

                <SectionTitle>{t('sidebar.course_objective_title')}</SectionTitle>
                <p style={{ color: 'white', lineHeight: '1.6' }}>{course.objective}</p>

                <SectionTitle>{t('sidebar.course_outcome_title')}</SectionTitle>
                <p style={{ color: 'white', lineHeight: '1.6' }}>{course.outcome}</p>

                <SectionTitle>{t('sidebar.course_index_title')}</SectionTitle>
                <IndexList>
                    {course.index?.subtopics.map((subtopic, sIndex) => (
                        <SubtopicItem key={subtopic._id || sIndex}>
                            <h4>{sIndex + 1}. {subtopic.title}</h4>
                            <ul>
                                {subtopic.lessons.map((lesson, lIndex) => (
                                    <li key={lesson._id || lIndex}>{lesson.title}</li>
                                ))}
                            </ul>
                        </SubtopicItem>
                    ))}
                </IndexList>

                {firstLessonId && ( // Only show button if a first lesson exists
                    <ActionButton onClick={() => navigate(`/course/${courseId}/lesson/${firstLessonId}`)}>
                        {t('sidebar.view_course_content_button')}
                    </ActionButton>
                )}
                {!firstLessonId && ( // Inform user if no lessons are found
                    <p style={{textAlign: 'center', color: '#ff4d4f', marginTop: '1rem'}}>
                        No lessons found for this course.
                    </p>
                )}
            </CourseDetailCard>
        </PageContainer>
    );
};

export default CourseOverviewPage;