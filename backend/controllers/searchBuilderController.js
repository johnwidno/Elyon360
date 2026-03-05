const db = require('../models');
const { Op } = require('sequelize');
const exceljs = require('exceljs');
const PDFDocument = require('pdfkit');
const Table = require('pdfkit-table');

const WHITELIST = {
    'members': {
        model: 'User',
        label: 'Membres',
        icon: '👤',
        associations: [
            { id: 'donations', label: 'Dons / Offrandes', model: 'Donation', as: 'donations', type: '1:N' },
            { id: 'memberGroups', label: 'Groupes', model: 'Group', as: 'memberGroups', type: 'N:M', through: 'group_member' },
            { id: 'attendedEvents', label: 'Événements', model: 'Event', as: 'attendedEvents', type: 'N:M', through: 'event_participant' },
            { id: 'contactSubtype', label: 'Type/Sous-type', model: 'ContactSubtype', as: 'contactSubtype', type: 'N:1' }
        ]
    },
    'groups': {
        model: 'Group',
        label: 'Groupes',
        icon: '👥',
        associations: [
            { id: 'groupMembers', label: 'Membres', model: 'User', as: 'groupMembers', type: 'N:M', through: 'group_member' },
            { id: 'activities', label: 'Activités', model: 'GroupActivity', as: 'activities', type: '1:N' }
        ]
    },
    'events': {
        model: 'Event',
        label: 'Événements',
        icon: '📅',
        associations: [
            { id: 'eventAttendees', label: 'Participants', model: 'User', as: 'eventAttendees', type: 'N:M', through: 'event_participant' }
        ]
    },
    'donations': {
        model: 'Donation',
        label: 'Dons / Offrandes',
        icon: '💰',
        associations: [
            { id: 'member', label: 'Membre', model: 'User', as: 'member', type: 'N:1' },
            { id: 'bankAccount', label: 'Compte Bancaire', model: 'BankAccount', as: 'bankAccount', type: 'N:1' }
        ]
    },
    'expenses': {
        model: 'Expense',
        label: 'Dépenses',
        icon: '📉',
        associations: [
            { id: 'budget', label: 'Budget', model: 'Budget', as: 'budget' },
            { id: 'bankAccount', label: 'Compte Bancaire', model: 'BankAccount', as: 'bankAccount' }
        ]
    },
    'inventory': { model: 'InventoryItem', label: 'Inventaire', icon: '📦' },
    'visitors': { model: 'Visitor', label: 'Visiteurs', icon: '👋' },
    'sunday_school': { model: 'SundaySchool', label: 'École du Dimanche', icon: '📖' },
    'ceremonies': { model: 'Ceremony', label: 'Cérémonies', icon: '✨' }
};

const OPERATORS = {
    'equals': Op.eq,
    'not_equals': Op.ne,
    'greater_than': Op.gt,
    'left_than': Op.lt, // Note: fixing typo if any or keeping consistency with earlier code
    'less_than': Op.lt,
    'greater_equal': Op.gte,
    'less_equal': Op.lte,
    'contains': Op.iLike,
    'starts_with': Op.iLike,
    'ends_with': Op.iLike,
    'between': Op.between,
    'in': Op.in,
    'today': Op.between,
    'this_month': Op.between,
    'this_year': Op.between,
    'date_range': Op.between
};

/**
 * Shared helper to build where clause with advanced filters
 */
const buildWhereClause = (filters, churchId) => {
    const where = { churchId };
    if (!filters || !Array.isArray(filters)) return where;

    filters.forEach(f => {
        if (!f.field || !OPERATORS[f.operator]) return;

        let value = f.value;
        const op = f.operator;

        // String formatting
        if (op === 'contains') value = `%${f.value}%`;
        else if (op === 'starts_with') value = `${f.value}%`;
        else if (op === 'ends_with') value = `%${f.value}`;

        // Date Range Logic
        const now = new Date();
        if (op === 'today') {
            const start = new Date(now.setHours(0, 0, 0, 0));
            const end = new Date(now.setHours(23, 59, 59, 999));
            value = [start, end];
        } else if (op === 'this_month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            value = [start, end];
        } else if (op === 'this_year') {
            const start = new Date(now.getFullYear(), 0, 1);
            const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            value = [start, end];
        } else if (op === 'date_range') {
            if (Array.isArray(f.value)) {
                value = [new Date(f.value[0]), new Date(f.value[1])];
            } else if (typeof f.value === 'string' && f.value.includes(',')) {
                const parts = f.value.split(',');
                value = [new Date(parts[0]), new Date(parts[1])];
            } else {
                return; // Invalid range
            }
        } else if (['equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(op) && String(f.value).match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Handle single date strings for potentially TIMESTAMP columns
            const d = new Date(f.value);
            if (op === 'equals') {
                const start = new Date(d.setHours(0, 0, 0, 0));
                const end = new Date(d.setHours(23, 59, 59, 999));
                where[f.field] = { [Op.between]: [start, end] };
                return;
            } else if (op === 'greater_than') {
                value = new Date(d.setHours(23, 59, 59, 999));
            } else if (op === 'greater_equal') {
                value = new Date(d.setHours(0, 0, 0, 0));
            } else if (op === 'less_than') {
                value = new Date(d.setHours(0, 0, 0, 0));
            } else if (op === 'less_equal') {
                value = new Date(d.setHours(23, 59, 59, 999));
            }
        }

        let fieldKey = f.field;
        if (f.field.includes('.')) {
            const parts = f.field.split('.');
            fieldKey = parts.length === 3 ? `$${parts[0]}.${parts[1]}.${parts[2]}$` : `$${parts[0]}.${parts[1]}$`;
        }

        // Special handling for role (stored as JSON string)
        if (fieldKey === 'role' || fieldKey.endsWith('.role')) {
            const roleVal = `%"${value}"%`;
            where[fieldKey] = { [Op.iLike]: roleVal };
        } else {
            where[fieldKey] = { [OPERATORS[op]]: value };
        }
    });
    return where;
};

/**
 * Get distinct/predefined values for specific fields to help user filtering
 */
exports.getFilterValues = async (req, res) => {
    const { field } = req.params;
    const { table } = req.query;
    const churchId = req.church.id;

    if (!table || !field) return res.json([]);

    const toSentenceCase = (str) => {
        if (!str) return str;
        if (typeof str !== 'string') return str;
        const s = String(str).toLowerCase().trim();
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    try {
        // 1. Determine Model & Field Path
        let TargetModel;
        let colName = field;

        if (field.includes('.')) {
            const [assocAs, attrName] = field.split('.');
            const mainConfig = WHITELIST[table];
            const assoc = mainConfig?.associations?.find(a => a.as === assocAs);
            if (!assoc) return res.json([]);
            TargetModel = db[assoc.model];
            colName = attrName;
        } else {
            const mainConfig = WHITELIST[table];
            if (!mainConfig) return res.json([]);
            TargetModel = db[mainConfig.model];
        }

        if (!TargetModel) return res.json([]);

        // 2. Special Relational Labels (Subtypes, Categories, Roles, Gender, Country)
        if (colName === 'role') {
            const roles = await db.Role.findAll({ where: { churchId }, attributes: ['name'] });
            // Add default roles if not in DB
            const defaultRoles = ['admin', 'member', 'staff', 'agent', 'super_admin'];
            const allRoles = [...new Set([...roles.map(r => r.name), ...defaultRoles])];
            return res.json(allRoles.map(r => ({ value: r, label: toSentenceCase(r) })));
        }

        if (colName === 'gender' || colName === 'sexe') {
            return res.json([
                { value: 'M', label: 'Masculin (M)' },
                { value: 'F', label: 'Féminin (F)' },
                { value: 'G', label: 'Garçon (G)' },
                { value: 'H', label: 'Homme (H)' }
            ]);
        }

        if (colName === 'country' || colName === 'pays') {
            const { countries } = require('../utils/countryList');
            if (countries) {
                return res.json(countries.map(c => ({ value: c.name, label: c.name })));
            }
        }

        if (colName === 'subtypeId') {
            const subtypes = await db.ContactSubtype.findAll({ where: { churchId }, attributes: ['id', 'name'] });
            return res.json(subtypes.map(s => ({ value: s.id, label: toSentenceCase(s.name) })));
        }

        if (colName === 'memberCategoryId' || colName === 'categoryId') {
            const categories = await db.MemberCategory.findAll({ where: { churchId }, attributes: ['id', 'name'] });
            return res.json(categories.map(c => ({ value: c.id, label: toSentenceCase(c.name) })));
        }

        if (colName === 'status' && table === 'members') {
            return res.json([
                { value: 'Actif', label: 'Actif' },
                { value: 'Inactif', label: 'Inactif' },
                { value: 'En déplacement', label: 'En déplacement' },
                { value: 'Décédé', label: 'Décédé' },
                { value: 'Transféré', label: 'Transféré' },
                { value: 'Abandonné', label: 'Abandonné' }
            ]);
        }

        if (colName === 'baptismalStatus') {
            return res.json([
                { value: 'baptized', label: 'Baptisé' },
                { value: 'not_baptized', label: 'Non baptisé' },
                { value: 'candidate', label: 'Candidat' },
                { value: 'adherent', label: 'Adhérent' },
                { value: 'transferred', label: 'Transféré' },
                { value: 'affiliated', label: 'Affilié' },
                { value: 'child', label: 'Enfant' },
                { value: 'other', label: 'Autre' }
            ]);
        }

        // 3. Dynamic DISTINCT from Records (Exact match)
        const records = await TargetModel.findAll({
            attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col(colName)), colName]],
            where: {
                churchId,
                [colName]: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] }
            },
            raw: true,
            limit: 100 // Avoid massive lists
        });

        const results = records.map(r => ({
            value: r[colName],
            label: toSentenceCase(r[colName])
        }));

        res.json(results);
    } catch (error) {
        console.error("Exact Values Fetch Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAvailableTables = async (req, res) => {
    try {
        const tables = Object.entries(WHITELIST).map(([key, config]) => ({
            id: key,
            label: config.label,
            icon: config.icon,
            associations: config.associations || []
        }));
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTableColumns = async (req, res) => {
    const { tableId } = req.params;
    const { joinedTableIds = [] } = req.query; // IDs in the format: assoc_as

    try {
        if (!WHITELIST[tableId]) return res.status(403).json({ message: "Table non autorisée" });

        const modelConfig = WHITELIST[tableId];
        const Model = db[modelConfig.model];

        let columns = Object.entries(Model.rawAttributes).map(([key, attr]) => ({
            id: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            type: attr.type.constructor.name,
            tableName: modelConfig.label,
            source: tableId
        }));

        const activeJoins = Array.isArray(joinedTableIds) ? joinedTableIds : [joinedTableIds];

        if (modelConfig.associations) {
            for (const assoc of modelConfig.associations) {
                if (!activeJoins.includes(assoc.as)) continue;

                // Add Relation Model Columns
                const AssocModel = db[assoc.model];
                const assocCols = Object.entries(AssocModel.rawAttributes).map(([key, attr]) => ({
                    id: `${assoc.as}.${key}`,
                    label: `[${assoc.label}] ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                    type: attr.type.constructor.name,
                    tableName: assoc.label,
                    source: assoc.as,
                    isRelation: true
                }));
                columns = [...columns, ...assocCols];

                // Add Through Model Columns (for N:M)
                if (assoc.through) {
                    const throughModel = db.sequelize.models[assoc.through];
                    if (throughModel) {
                        const throughCols = Object.entries(throughModel.rawAttributes).map(([key, attr]) => ({
                            id: `${assoc.as}.${assoc.through}.${key}`,
                            label: `[${assoc.label} Détails] ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                            type: attr.type.constructor.name,
                            tableName: `${assoc.label} (Infos Pivot)`,
                            source: `${assoc.as}.${assoc.through}`,
                            isRelation: true,
                            isThrough: true
                        }));
                        columns = [...columns, ...throughCols];
                    }
                }
            }
        }

        res.json(columns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.executeSearch = async (req, res) => {
    const {
        table,
        columns,
        filters,
        joins = [],
        aggregates = [],
        group_by = [],
        page = 1,
        limit = 50,
        order_by,
        order_direction = 'DESC'
    } = req.body;

    const churchId = req.church.id;
    const userId = req.user.id;

    try {
        if (!WHITELIST[table]) return res.status(403).json({ message: "Table non autorisée" });

        const modelConfig = WHITELIST[table];
        const Model = db[modelConfig.model];

        // 1. Build Include (Joins)
        const include = [];
        if (joins && Array.isArray(joins)) {
            joins.forEach(j => {
                const assoc = modelConfig.associations?.find(a => a.as === j);
                if (assoc) {
                    include.push({
                        model: db[assoc.model],
                        as: assoc.as,
                        attributes: columns.filter(c => c.startsWith(`${j}.`) && !c.includes(`.${assoc.through}.`)).map(c => c.split('.')[1]),
                        required: false, // LEFT JOIN
                        through: assoc.through ? {
                            model: db.sequelize.models[assoc.through],
                            attributes: columns.filter(c => c.startsWith(`${j}.${assoc.through}.`)).map(c => c.split('.')[2])
                        } : undefined
                    });
                }
            });
        }

        // 2. Build Attributes & Aggregates
        let finalAttributes = [];
        columns.forEach(col => {
            if (!col.includes('.')) {
                if (Model.rawAttributes[col]) finalAttributes.push(col);
            } else {
                // Relational column (e.g. donations.amount) - Sequelize handles via include
                // For simplicity in raw queries, we might need a different approach if using raw:true
            }
        });

        if (aggregates && Array.isArray(aggregates)) {
            aggregates.forEach(agg => {
                if (['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'].includes(agg.func)) {
                    finalAttributes.push([
                        db.sequelize.fn(agg.func, db.sequelize.col(agg.field)),
                        agg.alias || `${agg.func.toLowerCase()}_${agg.field.replace('.', '_')}`
                    ]);
                }
            });
        }

        // 3. Build Where Clause
        const where = buildWhereClause(filters, churchId);

        // 4. Grouping
        const group = group_by.length > 0 ? group_by : undefined;

        // 5. Execute
        const offset = (page - 1) * limit;
        const actualLimit = Math.min(limit, 1000);

        const { count, rows } = await Model.findAndCountAll({
            attributes: finalAttributes.length > 0 ? finalAttributes : undefined,
            include: include.length > 0 ? include : undefined,
            where,
            group,
            order: group ? undefined : (order_by ? [[order_by, order_direction]] : [['createdAt', 'DESC']]),
            limit: group ? undefined : actualLimit, // Pagination is tricky with grouping in findAndCountAll
            offset: group ? undefined : offset,
            subQuery: false,
            raw: true,
            nest: true
        });

        // Log query details
        await db.SearchQueryLog.create({
            userId, churchId, tableName: table, columns, filters, sqlQuery: "Advanced Relational Query", timestamp: new Date()
        });

        res.json({
            data: rows,
            total: Array.isArray(count) ? count.length : count,
            page,
            totalPages: Math.ceil((Array.isArray(count) ? count.length : count) / actualLimit)
        });

    } catch (error) {
        console.error("Advanced Search Execute Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.exportResults = async (req, res) => {
    const { format, table, columns, filters, joins = [] } = req.body;
    const churchId = req.church.id;

    try {
        if (!WHITELIST[table]) return res.status(403).json({ message: "Table non autorisée" });
        const modelConfig = WHITELIST[table];
        const Model = db[modelConfig.model];

        const include = [];
        if (joins && Array.isArray(joins)) {
            joins.forEach(j => {
                const assoc = modelConfig.associations?.find(a => a.as === j);
                if (assoc) {
                    include.push({
                        model: db[assoc.model],
                        as: assoc.as,
                        attributes: columns.filter(c => c.startsWith(`${j}.`) && !c.includes(`.${assoc.through}.`)).map(c => c.split('.')[1]),
                        required: false,
                        through: assoc.through ? {
                            model: db.sequelize.models[assoc.through],
                            attributes: columns.filter(c => c.startsWith(`${j}.${assoc.through}.`)).map(c => c.split('.')[2])
                        } : undefined
                    });
                }
            });
        }

        const where = buildWhereClause(filters, churchId);

        const data = await Model.findAll({
            attributes: columns.filter(c => !c.includes('.')).length > 0 ? columns.filter(c => !c.includes('.')) : undefined,
            include: include.length > 0 ? include : undefined,
            where,
            limit: 1000,
            raw: true,
            nest: true
        });

        // Flatten data for export
        const flattenedData = data.map(item => {
            const flat = { ...item };
            joins.forEach(j => {
                if (item[j] && typeof item[j] === 'object' && !Array.isArray(item[j])) {
                    Object.keys(item[j]).forEach(key => {
                        flat[`${j}.${key}`] = item[j][key];
                    });
                } else if (Array.isArray(item[j]) && item[j].length > 0) {
                    // For 1:N, if not grouped, Sequelize might return multiple rows, 
                    // but if it's nested as array, we take the first or join them
                    // This is a bit of a fallback.
                    const first = item[j][0];
                    Object.keys(first).forEach(key => {
                        flat[`${j}.${key}`] = first[key];
                    });
                }
            });
            return flat;
        });

        if (format === 'excel') {
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Résultats');

            // Map column IDs to nice labels for header if possible
            const headers = columns.map(colId => {
                const colLabel = colId.includes('.') ? colId.split('.').pop() : colId;
                return { header: colLabel.toUpperCase(), key: colId, width: 25 };
            });

            worksheet.columns = headers;
            worksheet.addRows(flattenedData);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.xlsx`);
            return workbook.xlsx.write(res).then(() => res.end());
        }

        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: columns.length > 5 ? 'landscape' : 'portrait' });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=export-${Date.now()}.pdf`);
            doc.pipe(res);

            const tableData = {
                title: `Rapport: ${WHITELIST[table].label}`,
                headers: columns.map(c => c.split('.').pop().toUpperCase()),
                rows: flattenedData.map(row => columns.map(c => {
                    const val = row[c];
                    return (val === null || val === undefined) ? '' : String(val);
                }))
            };

            const tableObj = new Table(doc, { bottomMargin: 30 });
            await tableObj.addTable(tableData, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font("Helvetica").fontSize(7);
                },
            });

            doc.end();
            return;
        }

    } catch (error) {
        console.error("Export Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
};

exports.saveSearch = async (req, res) => {
    const { name, table, columns, filters } = req.body;
    try {
        const saved = await db.SavedSearch.create({
            name,
            tableName: table,
            columns,
            filters,
            userId: req.user.id,
            churchId: req.church.id
        });
        res.json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSavedSearches = async (req, res) => {
    try {
        const searches = await db.SavedSearch.findAll({
            where: { churchId: req.church.id },
            include: [{
                model: db.User,
                as: 'user',
                attributes: ['firstName', 'lastName']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(searches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSavedSearch = async (req, res) => {
    try {
        await db.SavedSearch.destroy({
            where: { id: req.params.id, churchId: req.church.id }
        });
        res.json({ message: "Recherche supprimée" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
