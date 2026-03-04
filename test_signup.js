const fetch = require('node-fetch');

async function testSignup() {
    const url = 'https://etojsjppvmshairixudw.supabase.co/auth/v1/signup';
    const anonKey = 'sb_publishable_5UmAxpdX1HM0jqeGEE644Q_N0fZp837'; // From .env.local

    const headers = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        email: `test_user_error_${Date.now()}@gmail.com`,
        password: 'securepassword123',
        data: {
            full_name: 'Test Profile',
            role: 'parent'
        }
    });

    try {
        const res = await fetch(url, { method: 'POST', headers, body });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testSignup();
