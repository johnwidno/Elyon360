const db = require("../models");
const { Op } = require("sequelize");
const roomScheduler = require('../services/roomScheduler');
const Reservation = db.Reservation;
const Room = db.Room;
const User = db.User;
const Group = db.Group;

exports.createReservation = async (req, res) => {
    try {
        const { title, roomId, resourceIds, organizerId, groupId, startTime, endTime, type, notes } = req.body;
        const churchId = req.church.id;

        // Conflict Detection
        if (roomId && startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const dateStr = start.toISOString().split('T')[0];
            const startTimeStr = start.toTimeString().slice(0, 5);
            const endTimeStr = end.toTimeString().slice(0, 5);

            const availability = await roomScheduler.checkRoomAvailability({
                churchId,
                roomId,
                date: dateStr,
                startTime: startTimeStr,
                endTime: endTimeStr,
                type: 'reservation'
            });

            if (!availability.available) {
                return res.status(409).json({
                    message: `Conflit détecté : La salle est déjà occupée sur ce créneau par : ${availability.conflict.details.name || availability.conflict.details.title || 'un autre événement'}.`,
                    conflict: availability.conflict
                });
            }
        }

        const reservation = await Reservation.create({
            churchId,
            title,
            roomId,
            resourceIds,
            organizerId,
            groupId,
            startTime,
            endTime,
            type,
            notes,
            status: 'confirmed' // Default to confirmed for now, can be 'pending' if approval needed
        });

        res.status(201).json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllReservations = async (req, res) => {
    try {
        const churchId = req.church.id;
        const { start, end } = req.query; // Optional date range filter

        const whereClause = { churchId };
        if (start && end) {
            whereClause.startTime = { [Op.between]: [start, end] };
        }

        const reservations = await Reservation.findAll({
            where: whereClause,
            include: [
                { model: Room, as: 'room' },
                { model: User, as: 'organizer', attributes: ['id', 'firstName', 'lastName'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] }
            ],
            order: [['startTime', 'ASC']]
        });
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;
        const { roomId, startTime, endTime } = req.body;

        const reservation = await Reservation.findOne({ where: { id, churchId } });
        if (!reservation) return res.status(404).json({ message: "Reservation non trouvée." });

        if (roomId || startTime || endTime) {
            const rId = roomId || reservation.roomId;
            const start = startTime ? new Date(startTime) : new Date(reservation.startTime);
            const end = endTime ? new Date(endTime) : new Date(reservation.endTime);

            if (rId && start && end) {
                const dateStr = start.toISOString().split('T')[0];
                const startTimeStr = start.toTimeString().slice(0, 5);
                const endTimeStr = end.toTimeString().slice(0, 5);

                const availability = await roomScheduler.checkRoomAvailability({
                    churchId,
                    roomId: rId,
                    date: dateStr,
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    excludeId: id,
                    type: 'reservation'
                });

                if (!availability.available) {
                    return res.status(409).json({
                        message: `Conflit détecté : La salle est déjà occupée sur ce créneau par : ${availability.conflict.details.name || availability.conflict.details.title || 'un autre événement'}.`,
                        conflict: availability.conflict
                    });
                }
            }
        }

        await Reservation.update(req.body, { where: { id, churchId } });
        const updatedReservation = await Reservation.findOne({
            where: { id, churchId },
            include: [
                { model: Room, as: 'room' },
                { model: User, as: 'organizer', attributes: ['id', 'firstName', 'lastName'] },
                { model: Group, as: 'group', attributes: ['id', 'name'] }
            ]
        });

        res.status(200).json(updatedReservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;

        await Reservation.destroy({ where: { id, churchId } });
        res.status(200).json({ message: "Reservation deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
