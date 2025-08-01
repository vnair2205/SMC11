// server/models/Course.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const VideoHistorySchema = new mongoose.Schema({
  videoUrl: { type: String },
  videoChannelId: { type: String },
  videoChannelTitle: { type: String }
});

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  englishTitle: { type: String }, // Added: English version of lesson title
  content: { type: String },
  videoUrl: { type: String },
  videoChannelId: { type: String },
  videoChannelTitle: { type: String },
  videoHistory: [VideoHistorySchema],
  videoChangeCount: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false }
});

const SubtopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  englishTitle: { type: String }, // Added: English version of subtopic title
  lessons: [LessonSchema]
});

const QuizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }
});

const CourseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  englishTopic: { type: String }, // Added: English version of course topic
  objective: {
    type: String,
  },
  outcome: {
    type: String,
  },
  language: {
    type: String,
    default: 'en',
  },
  languageName: {
    type: String,
    default: 'English'
  },
  nativeName: {
    type: String,
    default: 'English'
  },
  numSubtopics: {
    type: Number,
    default: 1,
  },
  thumbnailUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active',
  },
  index: {
    subtopics: [SubtopicSchema]
  },
  notes: {
    type: String,
    default: ''
  },
  quiz: [QuizQuestionSchema],
  score: {
    type: Number,
  },
  completionDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Apply the pagination plugin to your schema
CourseSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Course', CourseSchema);