const { Schema, model } = require('../connection');

const transcriptSchema = new Schema({
    meetingId: {
        type: String,
        required: true,
        index: true
    },
    meetingStart: {
        type: Date,
        required: true
    },
    meetingEnd: {
        type: Date,
        required: true
    },
    participants: [{
        type: String
    }],
    fullTranscript: [{
        speaker: String,
        text: String,
        timestamp: Date
    }],
    extractedInfo: {
        dates: [String],
        times: [String],
        nextMeetings: [String],
        actionItems: [String],
        topics: [String]
    },
    aiSummary: {
        mainTopics: [String],
        keyDecisions: [String],
        actionItems: [String],
        nextSteps: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, 
{
    timestamps: true
});

module.exports = model('transcript', transcriptSchema)