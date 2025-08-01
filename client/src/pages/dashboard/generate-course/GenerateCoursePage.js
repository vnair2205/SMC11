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
        objective: [],
        outcome: [], // CHANGED: Outcome is now an array
        numSubtopics: 1,
        language: 'en',
        languageName: 'English',
        nativeName: 'English',
        index: null,
        customLessons: [],
        customObjectives: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [topicSuggestions, setTopicSuggestions] = useState([]);
    const [isRefineTopicModalOpen, setIsRefineTopicModalOpen] = useState(false);
    
    const [isRefineObjectiveModalOpen, setIsRefineObjectiveModalOpen] = useState(false);
    const [objectiveSuggestions, setObjectiveSuggestions] = useState([]);
    
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
            setIsRefineTopicModalOpen(true);
        } catch (err) {
            console.error("Error in handleTopicSubmit (refine-topic):", err.response?.data || err.message);
            const originalTopic = courseData.topic;
            await proceedToObjectiveGeneration({ title: originalTopic, englishTitle: originalTopic });
        } finally {
            setIsLoading(false);
        }
    };

    const proceedToObjectiveGeneration = async (selectedSuggestion) => {
        setIsRefineTopicModalOpen(false);
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');

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
    
    const handleAddObjective = async (objectiveText) => {
        setIsLoading(true);
        setError('');
        
        if (courseData.customObjectives.length >= 2) {
             setError(t('course_generation.add_custom_objective_heading'));
             setIsLoading(false);
             return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = { courseId: courseData.courseId, newObjectiveText: objectiveText };
            const res = await axios.post('/api/course/refine-objective', body, config);
            
            setObjectiveSuggestions(res.data.suggestions);
            setIsRefineObjectiveModalOpen(true);
        } catch (err) {
            console.error("Error refining objective:", err.response?.data || err.message);
            setError(t('course_generation.suggestions_error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectObjectiveSuggestion = (suggestion) => {
        updateCourseData({ customObjectives: [...courseData.customObjectives, suggestion] });
        setIsRefineObjectiveModalOpen(false);
    };
    
    const handleObjectiveSubmit = async () => {
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const finalObjectives = [...courseData.objective, ...courseData.customObjectives];
            const { courseId, topic, language, languageName, nativeName, englishTopic } = courseData;
            const body = JSON.stringify({ courseId, topic, objective: finalObjectives, language, languageName, nativeName, englishTopic });
            const res = await axios.post('/api/course/generate-outcome', body, config);
            // CHANGED: Outcome from a single string to an array
            const outcomeArray = res.data.outcome.split('\n').filter(o => o.trim() !== '');
            updateCourseData({ outcome: outcomeArray });
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
                return <Step2_Objective
                    nextStep={handleObjectiveSubmit}
                    prevStep={prevStep}
                    updateCourseData={updateCourseData}
                    data={courseData}
                    isLoading={isLoading}
                    error={error}
                    handleAddObjective={handleAddObjective}
                />;
            case 4:
                return <Step3_Outcome
                    nextStep={nextStep}
                    prevStep={prevStep}
                    updateCourseData={updateCourseData}
                    data={courseData}
                    isLoading={isLoading}
                />;
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
            
            <Modal isOpen={isRefineTopicModalOpen} onClose={() => setIsRefineTopicModalOpen(false)} title={t('course_generation.refine_topic_modal_title')}>
                <ModalText>{t('course_generation.refine_topic_modal_message')}</ModalText>
                <ModalButtonContainer style={{ flexDirection: 'column', marginTop: '1.5rem' }}>
                    {topicSuggestions.map((suggestion, index) => (
                        <SuggestionButton primary key={index} onClick={() => proceedToObjectiveGeneration(suggestion)}>
                            {courseData.language === 'en' ? suggestion.title : `${suggestion.title} (${suggestion.englishTitle})`}
                        </SuggestionButton>
                    ))}
                </ModalButtonContainer>
            </Modal>

            <Modal isOpen={isRefineObjectiveModalOpen} onClose={() => setIsRefineObjectiveModalOpen(false)} title={t('course_generation.refine_objective_modal_title')}>
                <ModalText>{t('course_generation.refine_objective_modal_message')}</ModalText>
                <ModalButtonContainer style={{ flexDirection: 'column', marginTop: '1.5rem' }}>
                    {objectiveSuggestions.map((suggestion, index) => (
                        <SuggestionButton primary key={index} onClick={() => handleSelectObjectiveSuggestion(suggestion)}>
                            {suggestion}
                        </SuggestionButton>
                    ))}
                </ModalButtonContainer>
            </Modal>

            <ProgressBar currentStep={currentStep} />
            {renderStep()}
        </PageWrapper>
    );
};

export default GenerateCoursePage;