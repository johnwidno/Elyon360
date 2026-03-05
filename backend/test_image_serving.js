const axios = require('axios');

async function test() {
    try {
        const url = 'http://localhost:5000/uploads/image-1772138252546-79518436.jpeg';
        console.log('Testing URL:', url);
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        console.log('Status:', res.status);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Size:', res.data.length);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

test();
