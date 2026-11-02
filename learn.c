#include <avr/interrupt.h>

extern struct { uint8_t opcode, length, data[]; } sram;

static unsigned mark;
static uint8_t idx;

void learn_start() {
	mark = 0;
	idx = 0;
	PORTA.INTFLAGS = PIN3_bm;
	PORTA.PIN3CTRL = PORT_ISC_BOTHEDGES_gc;
	TCB0.CTRLB = TCB_CNTMODE_INT_gc;					// overflow interrupt
	TCB0.CCMP = 65535;									// 39 ms
	TCB0.CNT = 0;
	TCB0.INTCTRL = TCB_CAPT_bm;
	TCB0.CTRLA = TCB_CLKSEL_CLKDIV2_gc | TCB_ENABLE_bm;	// 0.6 us
}

uint8_t learn_done() { return TCB0.CTRLA ? 0 : idx; }

static void write(unsigned t) {
	union { unsigned i; struct { uint8_t low, high; }; } u;
	u.i = t >> 4;		// u.i = t / 32
	sram.data[idx] = u.low >> 1;
	if (u.high) { sram.data[idx++] |= 128; sram.data[idx] = u.high; }
	idx++;
}

static void save(unsigned t) {
	if (mark) {
		write(mark); write(t);
		if (!t || (idx > 120)) PORTA.PIN3CTRL = TCB0.CTRLA = TCB0.INTCTRL = 0;
	}
}

ISR(TCB0_INT_vect) {
	TCB0.INTFLAGS = TCB_CAPT_bm;	// clear IF
	save(0);
	mark = 0;
}

ISR(PORTA_PORT_vect) {
	unsigned cnt = TCB0.CNT;
	TCB0.CNT = 0;
	PORTA.INTFLAGS = PIN3_bm;
	if (PORTA.IN & PIN3_bm) mark = cnt;
	else save(cnt);
}
