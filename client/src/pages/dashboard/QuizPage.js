import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import Preloader from '../../components/common/Preloader';
import { FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const QuizOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #1e1e2d;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 2rem;
`;

const QuizContent = styled.div`
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 600px;
  background-color: #26262e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid #444;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover { color: white; }
`;

const QuestionHeader = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #444;
  text-align: center;
  p {
    color: #a0a0a0;
    font-size: 1rem;
  }
  h2 {
    color: white;
    font-size: 1.5rem;
    margin-top: 0.5rem;
  }
`;

const OptionsContainer = styled.div`
  flex-grow: 1;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const OptionButton = styled.button`
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  border: 2px solid #555;
  background-color: #33333d;
  color: white;
  transition: all 0.2s ease-in-out;

  &:not(:disabled):hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &.selected {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary + '30'};
  }

  &.correct {
    background-color: #28a745;
    border-color: #28a745;
    color: white;
  }

  &.incorrect {
    background-color: #dc3545;
    border-color: #dc3545;
    color: white;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;


const QuizFooter = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid #444;
  display: flex;
  justify-content: flex-end;
`;

const NextButton = styled.button`
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  
  &:disabled {
    background-color: #444;
    cursor: not-allowed;
  }
`;


const QuizPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [quiz, setQuiz] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const fetchQuiz = async () => {
            const token = localStorage.getItem('token');
            try {
                const config = { headers: { 'x-auth-token': token } };
                const res = await axios.post('/api/course/quiz/generate', { courseId }, config);
                setQuiz(res.data);
            } catch (err) {
                console.error("Failed to fetch or generate quiz", err);
                alert(t(err.response?.data?.msgKey || "errors.generic"));
                navigate(`/course/${courseId}`);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [courseId, navigate, t]);

    const handleAnswerSelect = (option) => {
        if (isAnswered) return;
        setSelectedAnswer(option);
        setIsAnswered(true);

        if (option === quiz[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            // Quiz finished, navigate to scorecard
            navigate(`/course/${courseId}/score`, { state: { score, total: quiz.length } });
        }
    };

    if (loading) {
        return <Preloader />;
    }

    const currentQuestion = quiz[currentQuestionIndex];

    return (
        <QuizOverlay>
            <QuizContent>
                <CloseButton onClick={() => navigate(`/course/${courseId}`)}><FiX /></CloseButton>
                
                <QuestionHeader>
                    <p>Question {currentQuestionIndex + 1} of {quiz.length}</p>
                    <h2>{currentQuestion.question}</h2>
                </QuestionHeader>

                <OptionsContainer>
                    {currentQuestion.options.map((option, index) => {
                        let className = '';
                        if (isAnswered) {
                            if (option === currentQuestion.correctAnswer) {
                                className = 'correct';
                            } else if (option === selectedAnswer) {
                                className = 'incorrect';
                            }
                        } else if (option === selectedAnswer) {
                            className = 'selected';
                        }
                        return (
                            <OptionButton
                                key={index}
                                onClick={() => handleAnswerSelect(option)}
                                className={className}
                                disabled={isAnswered}
                            >
                                {option}
                            </OptionButton>
                        );
                    })}
                </OptionsContainer>

                <QuizFooter>
                    <NextButton onClick={handleNextQuestion} disabled={!isAnswered}>
                        {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </NextButton>
                </QuizFooter>
            </QuizContent>
        </QuizOverlay>
    );
};

export default QuizPage;