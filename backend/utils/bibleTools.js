const bookMap = {
    // Français -> Code
    'genèse': '1', 'exode': '2', 'lévitique': '3', 'nombres': '4', 'deutéronome': '5',
    'josué': '6', 'juges': '7', 'ruth': '8', '1 samuel': '9', '2 samuel': '10',
    '1 rois': '11', '2 rois': '12', '1 chroniques': '13', '2 chroniques': '14', 'esdras': '15',
    'néhémie': '16', 'esther': '17', 'job': '18', 'psaumes': '19', 'proverbes': '20',
    'ecclésiaste': '21', 'cantique': '22', 'ésaïe': '23', 'jérémie': '24', 'lamentations': '25',
    'ézéchiel': '26', 'daniel': '27', 'osée': '28', 'joël': '29', 'amos': '30',
    'abdias': '31', 'jonas': '32', 'michée': '33', 'nahum': '34', 'habacuc': '35',
    'sophonie': '36', 'aggée': '37', 'zacharie': '38', 'malachie': '39',
    'matthieu': '40', 'marc': '41', 'luc': '42', 'jean': '43', 'actes': '44',
    'romains': '45', '1 corinthiens': '46', '2 corinthiens': '47', 'galates': '48', 'éphésiens': '49',
    'philippiens': '50', 'colossiens': '51', '1 thessaloniciens': '52', '2 thessaloniciens': '53', '1 timothée': '54',
    '2 timothée': '55', 'tite': '56', 'philémon': '57', 'hébreux': '58', 'jacques': '59',
    '1 pierre': '60', '2 pierre': '61', '1 jean': '62', '2 jean': '63', '3 jean': '64',
    'jude': '65', 'apocalypse': '66',

    // Creole -> Code (Adding common ones)
    'jeneze': '1', 'egzod': '2', 'levitik': '3', 'nonb': '4', 'deteronòm': '5',
    'jozye': '6', 'jij': '7', 'rit': '8', 'som': '19', 'jan': '43'
};

/**
 * Parses a reference like "Jean 3:16" or "Jean 3:10-20" or "Jean 3:1,2,5"
 */
exports.parseReference = (ref) => {
    try {
        const parts = ref.trim().split(' ');
        let bookName = '';
        let rest = '';

        // Handle books with numbers like "1 Jean"
        if (['1', '2', '3'].includes(parts[0])) {
            bookName = (parts[0] + ' ' + parts[1]).toLowerCase();
            rest = parts.slice(2).join(' ');
        } else {
            bookName = parts[0].toLowerCase();
            rest = parts.slice(1).join(' ');
        }

        const bookCode = bookMap[bookName];
        
        let chapter = '1';
        let verses = [];

        if (rest.includes(':')) {
            const [c, v] = rest.split(':');
            chapter = c.trim();
            
            // Handle ranges: 10-20
            if (v.includes('-')) {
                const [start, end] = v.split('-').map(n => parseInt(n.trim()));
                for (let i = start; i <= end; i++) verses.push(i);
            } 
            // Handle specific picks: 1,2,5
            else if (v.includes(',')) {
                verses = v.split(',').map(n => parseInt(n.trim()));
            }
            // Single verse
            else {
                verses = [parseInt(v.trim())];
            }
        } else if (rest.trim()) {
            chapter = rest.trim(); // Just chapter: "Jean 3"
        }

        return { bookCode, chapter, verses };
    } catch (err) {
        console.error("Parse Error:", err);
        return { bookCode: null, chapter: null, verses: [] };
    }
};
