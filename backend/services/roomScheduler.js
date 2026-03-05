const db = require('../models');
const { Op } = require('sequelize');

/**
 * Check if a room is available for a specific time slot
 * @param {Object} params
 * @param {number} params.churchId
 * @param {number} params.roomId
 * @param {string} params.date - YYYY-MM-DD
 * @param {string} params.startTime - HH:mm
 * @param {string} params.endTime - HH:mm
 * @param {string|number} [params.excludeId] - ID to exclude (for updates)
 * @param {string} [params.type] - 'event' or 'group' (model type of the requester)
 * @returns {Promise<{available: boolean, conflict: Object|null}>}
 */
exports.checkRoomAvailability = async ({ churchId, roomId, date, startTime, endTime, excludeId, type }) => {
    if (!roomId) return { available: true };

    // Get Day of Week (e.g., "Lundi") safely without timezone shifts
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayOfWeek = days[dateObj.getDay()];

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    console.log(`[ConflictCheck] Testing ${date} (${dayOfWeek}) ${startTime}-${endTime} for Room ${roomId} (Church: ${churchId})`);

    try {
        // 0. Check Room's own Recurring Schedule (Fixed reservations/availability)
        const room = await db.Room.findOne({ where: { id: roomId, churchId } });
        if (!room) {
            console.log(`[ConflictCheck] Room ${roomId} not found for Church ${churchId}`);
        } else if (room.recurringSchedule) {
            let roomSched = room.recurringSchedule;
            if (typeof roomSched === 'string') {
                try { roomSched = JSON.parse(roomSched); } catch (e) { roomSched = []; }
            }
            console.log(`[ConflictCheck] Checking Room Fixed Schedule: ${JSON.stringify(roomSched)}`);
            if (Array.isArray(roomSched)) {
                for (const slot of roomSched) {
                    if (slot.day && slot.day.trim().toLowerCase() === dayOfWeek.toLowerCase()) {
                        const slotStart = slot.startTime || slot.start;
                        const slotEnd = slot.endTime || slot.end;
                        if (isTimeOverlap(startTime, endTime, slotStart, slotEnd)) {
                            console.log(`[ConflictCheck] CONFLICT with Room Fixed Schedule: ${slotStart}-${slotEnd}`);
                            return {
                                available: false,
                                conflict: {
                                    type: 'room_fixed_schedule',
                                    details: { name: `Horaire fixe de la salle: ${slot.description || 'Réservé'}` }
                                }
                            };
                        }
                    }
                }
            }
        }

        // 1. Check Events (One-time)
        console.log(`[ConflictCheck] Step 1: Checking Events...`);
        const eventConflicts = await db.Event.findAll({
            where: {
                churchId,
                roomId,
                [Op.or]: [
                    {
                        startDate: { [Op.lt]: endDateTime },
                        endDate: { [Op.gt]: startDateTime }
                    }
                ],
                ...(type === 'event' && excludeId ? { id: { [Op.ne]: excludeId } } : {})
            }
        });

        if (eventConflicts.length > 0) {
            console.log(`[ConflictCheck] CONFLICT with Event: ${eventConflicts[0].title}`);
            return {
                available: false,
                conflict: {
                    type: 'event',
                    details: eventConflicts[0]
                }
            };
        }

        // 2. Check Reservations (General)
        console.log(`[ConflictCheck] Step 2: Checking Reservations...`);
        const resConflicts = await db.Reservation.findAll({
            where: {
                churchId,
                roomId,
                status: { [Op.notIn]: ['rejected', 'cancelled'] },
                [Op.or]: [
                    {
                        startTime: { [Op.lt]: endDateTime },
                        endTime: { [Op.gt]: startDateTime }
                    }
                ],
                ...(type === 'reservation' && excludeId ? { id: { [Op.ne]: excludeId } } : {})
            }
        });

        if (resConflicts.length > 0) {
            console.log(`[ConflictCheck] CONFLICT with Reservation: ${resConflicts[0].title}`);
            return {
                available: false,
                conflict: {
                    type: 'reservation',
                    details: resConflicts[0]
                }
            };
        }

        // 3. Check Groups (Recurring)
        console.log(`[ConflictCheck] Step 3: Checking Groups...`);
        const groups = await db.Group.findAll({
            where: {
                churchId,
                roomId,
                ...(type === 'group' && excludeId ? { id: { [Op.ne]: excludeId } } : {})
            }
        });

        for (const group of groups) {
            let schedule = group.recurringSchedule;
            if (typeof schedule === 'string') {
                try { schedule = JSON.parse(schedule); } catch (e) { continue; }
            }

            if (schedule && schedule.day && schedule.day.trim().toLowerCase() === dayOfWeek.toLowerCase()) {
                if (isTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
                    console.log(`[ConflictCheck] CONFLICT with Group: ${group.name}`);
                    return {
                        available: false,
                        conflict: {
                            type: 'group',
                            details: group
                        }
                    };
                }
            }
        }

        // 4. Check Sunday School Classes (Recurring)
        console.log(`[ConflictCheck] Step 4: Checking Sunday School Classes...`);
        const classes = await db.SundaySchool.findAll({
            where: {
                churchId,
                roomId,
                ...(type === 'class' && excludeId ? { id: { [Op.ne]: excludeId } } : {})
            }
        });

        for (const cls of classes) {
            let schedule = cls.recurringSchedule;
            if (typeof schedule === 'string') {
                try { schedule = JSON.parse(schedule); } catch (e) { continue; }
            }

            if (schedule && schedule.day && schedule.day.trim().toLowerCase() === dayOfWeek.toLowerCase()) {
                if (isTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
                    console.log(`[ConflictCheck] CONFLICT with Sunday School Class: ${cls.name}`);
                    return {
                        available: false,
                        conflict: {
                            type: 'class',
                            details: cls
                        }
                    };
                }
            }
        }

        console.log(`[ConflictCheck] SUCCESS: No conflicts found.`);
        return { available: true };

    } catch (error) {
        console.error("Conflict Check Error:", error);
        throw error;
    }
};

/**
 * Helper to check time overlap
 * Times are HH:mm strings. Normalizes to ensure zero-padding.
 */
function isTimeOverlap(start1, end1, start2, end2) {
    if (!start1 || !end1 || !start2 || !end2) return false;

    // Normalize to HH:mm (e.g. "8:00" -> "08:00")
    const normalize = (t) => {
        let [h, m] = t.split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    };

    const s1 = normalize(start1);
    const e1 = normalize(end1);
    const s2 = normalize(start2);
    const e2 = normalize(end2);

    return (s1 < e2 && e1 > s2);
}
