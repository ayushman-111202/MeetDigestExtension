const express = require('express');
const Model = require('../models/TranscriptModel');
const router = express.Router();

router.post('/add', (req, res) => {
    const { meetingId, timestamp, participants, fullTranscript } = req.body;

    const newTranscript = new Model({
        meetingId,
        meetingStart: fullTranscript.length > 0 ? fullTranscript[0].timestamp : timestamp,
        meetingEnd: timestamp,
        participants,
        fullTranscript
    });

    newTranscript.save()
        .then((result) => {
            res.status(200).json(result);
            console.log(result);
        }).catch((err) => {
            console.log(err);
        });
});


router.get('/getall', (req, res) => {
    Model.find()
        .then((result) => {
            res.status(200).json(result)
        }).catch((err) => {
            console.log(err);
        });
});

router.delete('/delete/id', (req, res) => {
    console.log(res.body);
    Model.findByIdAndDelete(req.params.id)
        .then((result) => {
            res.status(200).json(result);
        }).catch((err) => {
            console.log(err);
        });

})

module.exports = router;