
function decode(input: string) {
    try {
        const decoded = Buffer.from(input, 'base64').toString('utf8').trim();
        console.log(`Input: "${input}" -> Decoded: "${decoded}" (Length: ${decoded.length})`);
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        console.log(`Valid UUID: ${UUID_REGEX.test(decoded)}`);
    } catch (e) {
        console.log(`Input: "${input}" -> Error: ${e.message}`);
    }
}

const original = 'NWVkMDk2NGItMTBjYy00NjJkLThiMzctZDEyMWZkNjRmMTgx';
decode(original);
decode(original + '1');
decode(original + '2');
decode(original + 'a');
