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

// Assuming useAuth and useNavigate are used elsewhere or were intended to be used,
// but they are not directly used in the provided snippet's core logic.
// If you need them for other parts of this component, keep them.
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../../context/AuthContext'; // Re-check this path if it causes issues again

const SuggestionButton = styled(ModalButton)`
    width: 100%;
    margin-bottom: 0.75rem;
    text-align: center;
`;

const GenerateCoursePage = () => {
    // const { currentUser } = useAuth(); // If used, ensure AuthContext path is correct
    // const navigate = useNavigate(); // If used

    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [courseData, setCourseData] = useState({
        courseId: null,
        topic: '', // User's input / Native language topic
        englishTopic: '', // NEW: To store the English version of the topic
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
    
    // topicSuggestions will now store objects { title, englishTitle } from refine-topic API
    const [topicSuggestions, setTopicSuggestions] = useState([]); 
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const updateCourseData = (newData) => {
        setCourseData(prev => ({ ...prev, ...newData }));
        if (error) setError('');
    };

    // This is called when the user initially submits their topic
    const handleTopicSubmit = async () => {
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        try {
            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const { topic, languageName, nativeName } = courseData; // Get topic from courseData
            
            // Send the user's initial topic for refinement
            const body = JSON.stringify({ topic, languageName, nativeName });
            const res = await axios.post('/api/course/refine-topic', body, config);
            
            // setTopicSuggestions now expects an array of { title, englishTitle }
            setTopicSuggestions(res.data.suggestions); 
            setIsRefineModalOpen(true);
        } catch (err) {
            // If refine-topic fails or returns an error, proceed with original topic
            // IMPORTANT: If refine-topic *must* provide English, handle this error more robustly.
            // For now, if an error, we assume the original topic is also the English one or fall back.
            // THIS MIGHT BE A WEAK POINT IF original topic is NOT English and refine-topic fails.
            console.error("Error in handleTopicSubmit (refine-topic):", err.response?.data || err.message);
            const originalTopic = courseData.topic; // Use the original topic input
            // Pass the original topic's native and (assumed) English version
            await proceedToObjectiveGeneration({ title: originalTopic, englishTitle: originalTopic }); 
        } finally {
            setIsLoading(false);
        }
    };
    
    // MODIFIED: This function now accepts a suggestion object { title, englishTitle }
    const proceedToObjectiveGeneration = async (selectedSuggestion) => {
        setIsRefineModalOpen(false); // Close the modal
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');

        try {
            // Update courseData with the selected native and English topic
            const updatedData = { 
                ...courseData, 
                topic: selectedSuggestion.title, // Native language topic
                englishTopic: selectedSuggestion.englishTitle // English language topic
            };
            setCourseData(updatedData);

            const config = { headers: { 'Content-Type': 'application/json', 'x-auth-token': token } };
            const body = JSON.stringify({ 
                topic: updatedData.topic, // Pass the native topic for objective generation
                englishTopic: updatedData.englishTopic, // Pass the English topic (crucial for generateObjective saving)
                language: updatedData.language, 
                languageName: updatedData.languageName, 
                nativeName: updatedData.nativeName 
            });
            const res = await axios.post('/api/course/generate-objective', body, config);
            
            // Update course data with objective and courseId
            updateCourseData({ 
                objective: res.data.objective, 
                courseId: res.data.courseId, 
                topic: updatedData.topic, // Confirm native topic
                englishTopic: updatedData.englishTopic // Confirm English topic
            });
            nextStep(); // Move to the next step
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
            // Ensure englishTopic is passed here as well, if needed by the backend for generate-outcome (though not explicitly required by prompt for outcome)
            const { courseId, topic, objective, language, languageName, nativeName, englishTopic } = courseData; 
            const body = JSON.stringify({ courseId, topic, objective, language, languageName, nativeName, englishTopic }); // Added englishTopic
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
            // Ensure englishTopic is passed here as well
            const { courseId, topic, objective, outcome, numSubtopics, language, languageName, nativeName, customLessons, englishTopic } = courseData; 
            const body = JSON.stringify({ courseId, topic, objective, outcome, numSubtopics, language, languageName, nativeName, customLessons, englishTopic }); // Added englishTopic
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
                // Pass topic from courseData for display/input, handle submit to trigger refinement
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
                // Fallback to initial step or an error state
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
                        // MODIFIED: Pass the entire suggestion object to proceedToObjectiveGeneration
                        <SuggestionButton key={index} onClick={() => proceedToObjectiveGeneration(suggestion)}>
                            {suggestion.title} ({suggestion.englishTitle}) {/* Display both titles */}
                        </SuggestionButton>
                    ))}
                    <hr style={{width: '100%', border: '1px solid #555', margin: '0.5rem 0'}} />
                    <SuggestionButton primary onClick={() => proceedToObjectiveGeneration({ title: courseData.topic, englishTitle: courseData.englishTopic || courseData.topic })}>
                        {/* Ensure englishTopic fallback for the original topic as well */}
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