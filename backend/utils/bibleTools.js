const bookMap = {
    // Français
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

    // English
    'genesis': '1', 'exodus': '2', 'leviticus': '3', 'numbers': '4', 'deuteronomy': '5',
    'joshua': '6', 'judges': '7', '1 samuel': '9', '2 samuel': '10',
    '1 kings': '11', '2 kings': '12', '1 chronicles': '13', '2 chronicles': '14', 'ezra': '15',
    'nehemiah': '16', 'psalms': '19', 'proverbs': '20',
    'ecclesiastes': '21', 'song of solomon': '22', 'isaiah': '23', 'jeremiah': '24', 'lamentations': '25',
    'ezekiel': '26', 'hosea': '28', 'joel': '29', 'micah': '33', 'zephaniah': '36', 'haggai': '37', 'zechariah': '38', 'malachi': '39',
    'matthew': '40', 'mark': '41', 'luke': '42', 'john': '43', 'acts': '44',
    'romans': '45', '1 corinthians': '46', '2 corinthians': '47', 'galatians': '48', 'ephesians': '49',
    'philippians': '50', 'colossians': '51', '1 thessalonians': '52', '2 thessalonians': '53', '1 timothy': '54',
    '2 timothy': '55', 'titus': '56', 'philemon': '57', 'hebrews': '58', 'james': '59',
    '1 peter': '60', '2 peter': '61', '1 john': '62', '2 john': '63', '3 john': '64',
    'jude': '65', 'revelation': '66',

    // Creole (Common names used in Haitian Bible)
    'jeneze': '1', 'egzod': '2', 'levitik': '3', 'nonb': '4', 'deteronòm': '5',
    'jozye': '6', 'jij': '7', 'rit': '8', '1 samyèl': '9', '2 samyèl': '10',
    '1 wa': '11', '2 wa': '12', '1 kwonik': '13', '2 kwonik': '14', 'esdras': '15',
    'neemi': '16', 'estè': '17', 'jòb': '18', 'sòm': '19', 'pwoveb': '20',
    'eklezyas': '21', 'kantik': '22', 'izayi': '23', 'jeremi': '24', 'lamantasyon': '25',
    'ezekyèl': '26', 'danyèl': '27', 'oze': '28', 'jowèl': '29', 'amòs': '30',
    'abdias': '31', 'jonas': '32', 'miche': '33', 'naoum': '34', 'abakik': '35',
    'sofonni': '36', 'aje': '37', 'zakari': '38', 'malaki': '39',
    'matye': '40', 'mak': '41', 'lik': '42', 'jan': '43', 'travay': '44',
    'women': '45', '1 korent': '46', '2 korent': '47', 'galat': '48', 'efèz': '49',
    'filip': '50', 'kolòs': '51', '1 tesalonik': '52', '2 tesalonik': '53', '1 timote': '54',
    '2 timote': '55', 'tit': '56', 'filemon': '57', 'ebre': '58', 'jak': '59',
    '1 pyè': '60', '2 pyè': '61', 'jide': '65', 'revelasyon': '66'
};

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

exports.parseReference = (ref) => {
    try {
        const cleanRef = ref.trim().toLowerCase();
        let bookName = '';
        let rest = '';

        // Optimization: Find the longest matching book name from the beginning
        let foundBookName = '';
        let foundCode = null;

        for (const name of Object.keys(bookMap)) {
            if (cleanRef.startsWith(name)) {
                if (name.length > foundBookName.length) {
                    foundBookName = name;
                    foundCode = bookMap[name];
                }
            }
        }

        if (!foundCode) {
            // Try without accents
            const cleanNoAccents = removeAccents(cleanRef);
            for (const name of Object.keys(bookMap)) {
                if (cleanNoAccents.startsWith(removeAccents(name))) {
                    if (name.length > foundBookName.length) {
                        foundBookName = name;
                        foundCode = bookMap[name];
                    }
                }
            }
        }

        if (!foundCode) return { bookCode: null, chapter: null, verses: [] };

        rest = cleanRef.substring(foundBookName.length).trim();
        
        let chapter = '1';
        let verses = [];

        if (rest.includes(':')) {
            const [c, v] = rest.split(':');
            chapter = c.trim();
            const versePart = v.trim();
            
            if (versePart.includes('-')) {
                const [start, end] = versePart.split('-').map(n => parseInt(n.trim()));
                for (let i = start; i <= end; i++) verses.push(i);
            } else if (versePart.includes(',')) {
                verses = versePart.split(',').map(n => parseInt(n.trim()));
            } else {
                verses = [parseInt(versePart)];
            }
        } else if (rest) {
            chapter = rest;
        }

        return { bookCode: foundCode, chapter, verses };
    } catch (err) {
        console.error("Parse Error:", err);
        return { bookCode: null, chapter: null, verses: [] };
    }
};
