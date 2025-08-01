import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FiAward, FiHome, FiArrowRight } from 'react-icons/fi';

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
  border: 1px solid ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
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
    const { score, total } = location.state || { score: 0, total: 0 };
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    let message = "Good effort! Keep practicing to improve your score.";
    if (percentage >= 80) {
        message = "Excellent work! You've mastered the material.";
    } else if (percentage >= 60) {
        message = "Great job! You have a solid understanding of the topic.";
    }

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
        if (score !== undefined && total !== undefined && (score !== 0 || total !== 0)) {
            updateQuizCompletion();
        }
    }, [score, total, courseId]);

    const handleGetCertificate = () => {
        navigate(`/course/${courseId}/certificate`);
    };

    const handleBackToCoursePage = () => {
        // Pass refreshCourseData: true to force CourseViewPage to fetch latest data
        navigate(`/course/${courseId}`, { state: { showQuizCompletionMessage: percentage >= 60, refreshCourseData: true } });
    };

    return (
        <ScorePageContainer> {/* Corrected: Changed from PageContainer to ScorePageContainer */}
            <ScoreCard>
                <FiAward size={50} color="#03d9c5" />
                <Title>Quiz Complete!</Title>
                <ScoreText>
                    You scored<br/>
                    <span>{score} / {total}</span>
                </ScoreText>
                <MessageText>{message}</MessageText>
                <ButtonGroup>
                    {percentage >= 60 && (
                        <StyledButton primary onClick={handleGetCertificate}>
                            Get Certificate <FiArrowRight />
                        </StyledButton>
                    )}
                    <StyledButton onClick={handleBackToCoursePage}>
                        <FiHome /> Back to Course
                    </StyledButton>
                </ButtonGroup>
            </ScoreCard>
        </ScorePageContainer>
    );
};

export default ScoreCardPage;