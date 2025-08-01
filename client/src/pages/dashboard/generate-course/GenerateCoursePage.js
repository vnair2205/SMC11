// client/src/pages/dashboard/generate-course/GenerateCoursePage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { PageWrapper } from './GenerateCourse.styles';
import ProgressBar from './ProgressBar';
import Preloader from '../../../components/common/Preloader';
import { Modal, ModalText, ModalButtonContainer, ModalButton } from '../../../components/common/Modal';

// Import all the step components
import Step1_Topic from './Step1_Topic';
import Step2_Objective from './Step2_Objective';
import Step3_Outcome from './Step3_Outcome';
import Step4_Subtopics from './Step4_Subtopics';
import Step5_Language from './Step5_Language';
import Step6_Index from './Step6_Index';

const SuggestionButton = styled(ModalButton)`
    width: 100%;
    margin-bottom: 0.75rem;
    text-align: center;
`;

const GenerateCoursePage = () => {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [courseData, setCourseData] = useState({
        courseId: null,
        topic: '',
        englishTopic: '',
        objective: '',
        outcome: '',
        numSubtopics: 1,
        language: 'en',
        languageName: 'English',
        nativeName: 'English',
        index: null,
        customLessons: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [topicSuggestions, setTopicSuggestions] = useState([]); 
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const updateCourseData = (newData) => {
        setCourseData(prev => ({ ...prev, ...newData }));
        if (error) setError('');
    };

    const handleTopicSubmit = async () => {
        setIsLoading(true);
        setError('');
        
        const { topic, languageName, nativeName } = courseData;

        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            
            const body = JSON.stringify({ topic, languageName, nativeName });
            const res = await axios.post('/api/course/refine-topic', body, config);
            
            setTopicSuggestions(res.data.suggestions); 
            setIsRefineModalOpen(true);
        } catch (err) {
            console.error("Error in handleTopicSubmit (refine-topic):", err.response?.data || err.message);
            const originalTopic = courseData.topic;
            await proceedToObjectiveGeneration({ title: originalTopic, englishTitle: originalTopic }); 
        } finally {
            setIsLoading(false);
        }
    };
    
    const proceedToObjectiveGeneration = async (selectedSuggestion) => {
        setIsRefineModalOpen(false); 
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        // NEW LOGIC: Use the English title for both fields if the course language is English
        const finalTopic = courseData.language === 'en' ? selectedSuggestion.englishTitle : selectedSuggestion.title;
        const finalEnglishTopic = selectedSuggestion.englishTitle;

        try {
            const updatedData = { 
                ...courseData, 
                topic: finalTopic,
                englishTopic: finalEnglishTopic
            };
            setCourseData(updatedData);

            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = JSON.stringify({ 
                topic: updatedData.topic,
                englishTopic: updatedData.englishTopic,
                language: updatedData.language, 
                languageName: updatedData.languageName, 
                nativeName: updatedData.nativeName 
            });
            const res = await axios.post('/api/course/generate-objective', body, config);
            
            updateCourseData({ 
                objective: res.data.objective, 
                courseId: res.data.courseId, 
                topic: updatedData.topic, 
                englishTopic: updatedData.englishTopic
            });
            nextStep();
        } catch (err) {
            console.error("Error in proceedToObjectiveGeneration:", err.response?.data || err.message);
            const errorMsg = t(err.response?.data?.msgKey || 'errors.generic');
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleObjectiveSubmit = async () => {
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const { courseId, topic, objective, language, languageName, nativeName, englishTopic } = courseData; 
            const body = JSON.stringify({ courseId, topic, objective, language, languageName, nativeName, englishTopic });
            const res = await axios.post('/api/course/generate-outcome', body, config);
            updateCourseData({ outcome: res.data.outcome });
            nextStep();
        } catch (err) {
            console.error("Error in handleObjectiveSubmit:", err.response?.data || err.message);
            const errorMsg = t(err.response?.data?.msgKey || 'errors.generic');
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateIndex = async (callback) => {
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const { courseId, topic, objective, outcome, numSubtopics, language, languageName, nativeName, customLessons, englishTopic } = courseData; 
            const body = JSON.stringify({ courseId, topic, objective, outcome, numSubtopics, language, languageName, nativeName, customLessons, englishTopic });
            const res = await axios.post('/api/course/generate-index', body, config);
            updateCourseData({ index: res.data.index, customLessons: [] }); 
            if (callback) callback();
        } catch (err) {
            console.error("Error in handleGenerateIndex:", err.response?.data || err.message);
            const errorMsg = t(err.response?.data?.msgKey || 'errors.generic');
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step5_Language nextStep={nextStep} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} isLoading={isLoading} isFirstStep={true} />;
            case 2:
                return <Step1_Topic nextStep={handleTopicSubmit} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} isLoading={isLoading} error={error} />;
            case 3:
                return <Step2_Objective nextStep={handleObjectiveSubmit} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} isLoading={isLoading} />;
            case 4:
                return <Step3_Outcome nextStep={nextStep} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} isLoading={isLoading} />;
            case 5:
                return <Step4_Subtopics nextStep={() => handleGenerateIndex(nextStep)} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} />;
            case 6:
                return <Step6_Index handleGenerateIndex={() => handleGenerateIndex()} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} isLoading={isLoading} />;
            default:
                return <Step5_Language nextStep={nextStep} prevStep={prevStep} updateCourseData={updateCourseData} data={courseData} isLoading={isLoading} isFirstStep={true} />;
        }
    };

    return (
        <PageWrapper>
            {isLoading && <Preloader />}
            
            <Modal isOpen={isRefineModalOpen} onClose={() => setIsRefineModalOpen(false)} title="Refine Your Topic">
                <ModalText>We've generated a few alternative topics. Select one, or continue with your original topic.</ModalText>
                <ModalButtonContainer style={{ flexDirection: 'column', marginTop: '1.5rem' }}>
                    {topicSuggestions.map((suggestion, index) => (
                        <SuggestionButton key={index} onClick={() => proceedToObjectiveGeneration(suggestion)}>
                            {courseData.language === 'en' ? suggestion.title : `${suggestion.title} (${suggestion.englishTitle})`}
                        </SuggestionButton>
                    ))}
                    <hr style={{width: '100%', border: '1px solid #555', margin: '0.5rem 0'}} />
                    <SuggestionButton primary onClick={() => proceedToObjectiveGeneration({ title: courseData.topic, englishTitle: courseData.englishTopic || courseData.topic })}>
                        Continue with: "{courseData.topic}"
                    </SuggestionButton>
                </ModalButtonContainer>
            </Modal>

            <ProgressBar currentStep={currentStep} />
            {renderStep()}
        </PageWrapper>
    );
};

export default GenerateCoursePage;