const db = require("../models");
const Building = db.Building;
const Room = db.Room;
const User = db.User;
const Group = db.Group;
const SundaySchool = db.SundaySchool;
const Event = db.Event;
const Reservation = db.Reservation;
const InventoryItem = db.InventoryItem;

// ==========================================
// BUILDINGS
// ==========================================

exports.createBuilding = async (req, res) => {
    try {
        const {
            name, code, type, description,
            address, city, district, country, latitude, longitude,
            surfaceArea, floors, totalRooms, capacity, constructionYear, condition,
            status, usage,
            managerType, managerName, managerPhone, managerEmail
        } = req.body;
        const churchId = req.church.id;

        const building = await Building.create({
            churchId,
            name, code, type, description,
            address, city, district, country, latitude, longitude,
            surfaceArea, floors, totalRooms, capacity, constructionYear, condition,
            status, usage,
            managerType, managerName, managerPhone, managerEmail
        });

        res.status(201).json(building);
    } catch (error) {
        console.error("Create Building Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBuildings = async (req, res) => {
    try {
        if (!req.church) {
            return res.status(500).json({ message: "Church context missing" });
        }
        const churchId = req.church.id;

        const buildings = await Building.findAll({
            where: { churchId },
            include: [{ model: Room, as: 'rooms' }]
        });
        res.status(200).json(buildings);
    } catch (error) {
        console.error("getAllBuildings Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;

        await Building.update(req.body, { where: { id, churchId } });
        const updatedBuilding = await Building.findOne({ where: { id, churchId } });

        res.status(200).json(updatedBuilding);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;

        // Manually cascade delete rooms
        await Room.destroy({ where: { buildingId: id, churchId } });

        await Building.destroy({ where: { id, churchId } });
        res.status(200).json({ message: "Building and associated rooms deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// ROOMS
// ==========================================

exports.createRoom = async (req, res) => {
    try {
        const {
            name, code, buildingId, floor, type,
            area, capacity, layout, condition,
            status, authorizedUse, isBookable, maxBookingDuration, requiresApproval,
            recurringSchedule, defaultAvailability, bookingRules,
            facilities,
            managerId, managerType, managerContact,
            pmrAccess, emergencyExits, electricalSystem, specialRules,
            lastInspection, nextMaintenance, maintenanceHistory, observations,
            photos, layoutPlan
        } = req.body;

        const churchId = req.church.id;

        const cleanBuildingId = buildingId && buildingId !== '' ? parseInt(buildingId) : null;
        const cleanManagerId = managerId && managerId !== '' ? parseInt(managerId) : null;

        const cleanDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            return isNaN(d.getTime()) ? null : d;
        };

        const room = await Room.create({
            churchId,
            name, code, buildingId: cleanBuildingId, floor, type,
            area, capacity, layout, condition,
            status, authorizedUse, isBookable, maxBookingDuration, requiresApproval,
            recurringSchedule, defaultAvailability, bookingRules,
            facilities,
            managerId: cleanManagerId, managerType, managerContact,
            pmrAccess, emergencyExits, electricalSystem, specialRules,
            lastInspection: cleanDate(lastInspection), nextMaintenance: cleanDate(nextMaintenance), maintenanceHistory, observations,
            photos, layoutPlan
        });

        res.status(201).json(room);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllRooms = async (req, res) => {
    try {
        if (!req.church) {
            return res.status(500).json({ message: "Church context missing" });
        }
        const churchId = req.church.id;
        const rooms = await Room.findAll({
            where: { churchId },
            include: [
                { model: Building, as: 'building' },
                { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });
        res.status(200).json(rooms);
    } catch (error) {
        console.error("getAllRooms error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church?.id || req.user?.churchId;

        if (!churchId) {
            return res.status(401).json({ message: "Church configuration error" });
        }

        const room = await Room.findOne({
            where: { id, churchId },
            include: [
                { model: Building, as: 'building' },
                { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
                { model: Group, as: 'groups' },
                { model: SundaySchool, as: 'sundaySchoolClasses' },
                { model: Event, as: 'events' },
                { model: Reservation, as: 'reservations' },
                { model: InventoryItem, as: 'inventoryItems' }
            ]
        });

        if (!room) return res.status(404).json({ message: "Room not found" });

        res.status(200).json(room);
    } catch (error) {
        console.error("getRoomById Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;

        const updateData = { ...req.body };
        delete updateData.churchId;

        await Room.update(updateData, { where: { id, churchId } });
        const updatedRoom = await Room.findOne({
            where: { id, churchId },
            include: [
                { model: Building, as: 'building' },
                { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName'] }
            ]
        });

        res.status(200).json(updatedRoom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const churchId = req.church.id;

        await Room.destroy({ where: { id, churchId } });
        res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
