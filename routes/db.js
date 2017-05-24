/**
 * Created by tfeue on 5/19/2017.
 */
var express = require('express');

var db = {
    rooms: {
        'room-1': {
            room_id: 'room-1',
            room_name: 'Room 1',
            online_members: [],
            log: []
        },
        'second-room': {
            room_id: 'second-room',
            room_name: 'Second Room',
            online_members: [],
            log: []
        }
    },
    users: {
        'h3mJptTkQnYBNJf6': {
            id: 'h3mJptTkQnYBNJf6',
            username: "samsepi0l",
            rooms: ['room-1', 'second-room'],
            password: 'mr.r0b0t'
        },
        'vM3RP9huAdiitHyV': {
            id: 'vM3RP9huAdiitHyV',
            username: "D0loresH4ze",
            rooms: ['room-1'],
            password: 's0m3th1ng_cl3v3r'
        },
        'ZdEaOWTamXcTUJa3': {
            id: 'ZdEaOWTamXcTUJa3',
            username: 'admin',
            rooms: ['room-1', 'second-room'],
            password: 'password'
        }
    }
};

module.exports = db;
