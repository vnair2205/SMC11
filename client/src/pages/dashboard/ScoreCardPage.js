import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { FiAward, FiHome, FiArrowRight, FiThumbsUp, FiRepeat } from 'react-icons/fi'; // Added new icons

const ScorePageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const ScoreCard = styled.div`
  width: 450px;
  padding: 3rem;
  background-color: #33333d;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid ${({ theme, passed }) => (passed ? theme.colors.primary : '#a0a0a0')};
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: ${({ theme, passed }) => (passed ? theme.colors.primary : 'white')};
`;

const ScoreText = styled.p`
  font-size: 1.2rem;
  color: white;
  margin: 1.5rem 0;

  span {
    font-size: 3rem;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MessageText = styled.p`
  color: #a0a0a0;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-top: 2rem;
`;

const StyledButton = styled.button`
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
  background-color: ${({ theme, primary }) => (primary ? theme.colors.primary : '#555')};
  color: ${({ theme, primary }) => (primary ? theme.colors.background : 'white')};
`;

const ScoreCardPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const { t } = useTranslation(); // Initialize translation hook
    const { score, total } = location.state || { score: 0, total: 0 };
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const hasPassed = percentage >= 60;

    const updateQuizCompletion = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found for quiz completion update.");
            return;
        }
        console.log(`[ScoreCardPage] Sending score to server: score=${score}, total=${total}, courseId=${courseId}`); 
        try {
            await axios.put(
                `/api/course/complete-quiz/${courseId}`, 
                { score: score, totalQuestions: total },
                { headers: { 'x-auth-token': token } }
            );
            console.log("[ScoreCardPage] Quiz completion status updated on server successfully.");
        } catch (error) {
            console.error("Failed to update quiz completion on server:", error.response ? error.response.data : error.message); 
        }
    };

    useEffect(() => {
        if (score !== undefined && total !== undefined) {
            updateQuizCompletion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [score, total, courseId]);

    const handleGetCertificate = () => {
        navigate(`/course/${courseId}/certificate`);
    };

    const handleBackToCoursePage = () => {
        navigate(`/course/${courseId}`, { state: { showQuizCompletionMessage: hasPassed, refreshCourseData: true } });
    };

    return (
        <ScorePageContainer>
            <ScoreCard passed={hasPassed}>
                {hasPassed ? <FiAward size={50} color="#03d9c5" /> : <FiRepeat size={50} color="#a0a0a0" />}
                
                <Title passed={hasPassed}>
                    {t(hasPassed ? 'score_card.title_pass' : 'score_card.title_fail')}
                </Title>
                
                <ScoreText>
                    {t('score_card.score_text')}<br/>
                    <span>{score} / {total}</span>
                </ScoreText>
                
                <MessageText>
                    {t(hasPassed ? 'score_card.subtitle_pass' : 'score_card.subtitle_fail')}
                </MessageText>
                
                <ButtonGroup>
                    {hasPassed && (
                        <StyledButton primary onClick={handleGetCertificate}>
                            {t('score_card.get_certificate_button')} <FiArrowRight />
                        </StyledButton>
                    )}
                    <StyledButton onClick={handleBackToCoursePage}>
                        <FiHome /> {t('score_card.back_to_course_button')}
                    </StyledButton>
                </ButtonGroup>
            </ScoreCard>
        </ScorePageContainer>
    );
};

export default ScoreCardPage;