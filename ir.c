#include <avr/interrupt.h>

extern struct { uint8_t opcode, repeat, data[120]; } sram;

static uint8_t bits, count, *ptr;

static void ir_off() { ptr = 0; TCA0.SINGLE.CTRLA = TCB0.CTRLA = 0; }

static void next() {
	if (*ptr == 128) {
		if (sram.repeat) ptr -= ptr[1];
		else return ir_off();
	}
	if (!(bits = *ptr++)) ir_off();
	else {
		if (bits & 1) {
			count = (bits & 0x7f) >> 1;
			count--;
			bits &= 128;
		}
	}
}

void ir_start() {
	if (!sram.repeat) return;
	char *p = sram.data;
	bits = count = 0;
	uint8_t c = *p++;
	TCB0.CCMPL = c - 1;					// set carrier
	TCB0.CCMPH = 30;
	TCB0.CTRLB = TCB_CNTMODE_PWM8_gc;
	TCA0.SINGLE.PER = c * *p++;			// set bit width
	TCB0.CTRLA = TCB_ENABLE_bm;
	ptr = p;
	TCA0.SINGLE.CTRLA = TCA_SINGLE_ENABLE_bm;
}

ISR(TCA0_OVF_vect) {
	TCA0.SINGLE.INTFLAGS = TCA_SINGLE_OVF_bm;	// clear IF
	if (!ptr) return;
	if (bits & 128) TCB0.CTRLB |= TCB_CCMPEN_bm;
	else TCB0.CTRLB &= ~TCB_CCMPEN_bm;
	if (count) count--;
	else {
		if (bits & 0x3f) bits <<= 1;
		else next();
	}
}
