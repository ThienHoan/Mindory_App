import { createClient } from '@supabase/supabase-js';

const url = 'https://etojsjppvmshairixudw.supabase.co';
const anonKey = 'sb_publishable_5UmAxpdX1HM0jqeGEE644Q_N0fZp837';

const supabase = createClient(url, anonKey);

async function testSignup() {
    console.log("Starting signup...");
    const { data, error } = await supabase.auth.signUp({
        email: `test_error_500_${Date.now()}@example.com`,
        password: 'securepassword123',
        options: {
            data: {
                full_name: 'Test Profile',
                role: 'parent'
            }
        }
    });

    if (error) {
        console.error('Supabase Auth Error:', error.name, error.message, error.status, JSON.stringify(error, null, 2));
    } else {
        console.log('Signup Successful:', JSON.stringify(data, null, 2));
    }
}

testSignup();
