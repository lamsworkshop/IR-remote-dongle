function decode_ir(byteArray) {
	let i = 0;
	let data = [];
	while (byteArray[i]) {
		let d = byteArray[i++];
		if (d > 127) d += (byteArray[i++] - 1) * 127;
		data.push(d);
	}
	for (i = 0; i < data.length; i++)	// adjustment for RC filter
		data[i] += i & 1 ? 2.5 : -2.5;
	let min = data[0];
	data.forEach((e) => { if (e < min) min = e; });
	for (i = 0; i < data.length; i++)
		data[i] = Math.floor((data[i] + min/2) / min);
	return data;
}

function decode_array(array) {
	let string = decode_nec(array);
	if (string === "NAK") string = decode_rc6(array);
	if (string === "NAK") string = decode_sirc(array);
	return string;
}

function decode_array2string(array) {
	const mark_space = ["MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",
						"----------------------------------------"];
	let string = "";
	for (let i = 0; i < array.length; i++)
		string += mark_space[i & 1].substring(0, array[i]);
	return string;
}

function decode_rc6(data) {
	const string = decode_array2string(data).concat('-');
	if (string.length < 52) return "NAK";
	if (string.indexOf("MMMMMM--M--M-M-M")) return "NAK";
	let sub = string.substring(16, 20);
	if ((sub !== "MM--") && (sub !== "--MM")) return "NAK";
	let word = 0;
	for (let i = 20; i < 52; i += 2) {
		word <<= 1;
		if (string.substring(i, i + 2) === "-M") continue;
		if (string.substring(i, i + 2) === "M-") word++;
		else return "NAK";
	}
	let info = word & 255;
	let ctrl = word >> 8;
	return `RC6: ${ctrl} ${info}`;
}

function decode_nec(data) {
	if (data.length < 66) return "NAK";
	let word = 0;
	for (let i = 64; i > 1; i -= 2) {
		word <<= 1;
		if (data[i] != 1) return "NAK";
		if (data[i + 1] == 1) continue;
		if (data[i + 1] == 3) word++;
		else return "NAK";
	}
	const adr = word & 255;
	const adr1 = (word >> 8) & 255;
	const cmd = (word >> 16) & 255;
	const cmd1 = (word >> 24) & 255;
	if (((adr + adr1) == 255)&&((cmd + cmd1) == 255)&&(data[0] == 16)&&(data[1] == 8)) return `NEC: ${adr} ${cmd}`;
	else return `NEC(${data[0]},${data[1]}): ${adr} ${adr1} ${cmd} ${cmd1}`;
}

function decode_sirc(data) {
	if ((data[0] != 4) || (data[1] != 1)) return "NAK";
	let word = 0;
	let bit = 1;
	for (let i = 1; data[i] == 1; i += 2) {
		if (data[i + 1] > 2) return "NAK";
		if (data[i + 1] == 2) word += bit;
		bit <<= 1;
	}
	switch (bit) {
	case 4096: return `SIRC(12): ${word & 127} ${word >> 7}`;
	case 32768: return `SIRC(15): ${word & 127} ${word >> 7}`;
	case 1048576: return `SIRC(20): ${word & 127} ${(word >> 7) & 31} ${word >> 12}`;
	default: return "NAK";
	}
}
