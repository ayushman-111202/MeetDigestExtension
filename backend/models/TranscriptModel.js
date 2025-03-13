const { Schema, model } = require('../connection');

const transcriptSchema = new Schema({
    meetingId: { type: String, required: true, index: true },
    meetingStart: { type: Date, required: true },
    meetingEnd: { type: Date, required: true },
    participants: [{ type: String }],
    fullTranscript: [{ speaker: String, text: String, timestamp: Date }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('transcript', transcriptSchema)