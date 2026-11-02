var rc_toggle = 0x38;
function encode_rc6(adr, cmd) {
	const bit2 = new Uint8Array([0x58, 0x68, 0x98, 0xA8]);
	const data = new Uint8Array(9);
	rc_toggle = rc_toggle ^ 0xf0;
	let word = (adr << 8) + cmd;
	data[0] = rc_toggle;
	for (let i = 8; i > 0; i--) {
		data[i] = bit2[word & 3];
		word >>= 2;
	}
	return new Uint8Array([93,16,0xFE,0x28,0x56, ...data, 0x65,0x65,0x80,14]);
}

function encode_nec(adr, cmd) {
	const data = new Uint8Array(32);
	let word = ((255 - cmd) << 24) + (cmd << 16) + ((255 - adr) << 8) + adr;
	for (let i = 0; i < 32; i++) {
		data[i] = word & 1 ? 0x88: 0xA0;
		word >>= 1;
	}
	return new Uint8Array([88,21,0xA1,0x11, ...data, 0x82,0x7F,0xA1,0xA0,0x6D,0x6D,0x80,5]);
}

function encode_sirc20(cmd, adr, ext) {
	const bit2 = new Uint8Array([0xA8, 0xD4, 0xB4, 0xDA]);
	const data = new Uint8Array(10);
	let word = (ext << 12) + (adr << 7) + cmd;
	for (let i = 0; i < 10; i++) {
		data[i] = bit2[word & 3];
		word >>= 2;
	}
	return new Uint8Array([83, 24, 0xF4, ...data, 0x2B, 0x80, 12]);
}
