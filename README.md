# IR Remote Dongle

The dongle converts Uint8Array to IR flashing and vice versa. It makes use of an ESP01 as a websocket server which serves atmost 4 clients simultaneously.

## IR Remote Control Theory

You must visit [sbprojects](https://www.sbprojects.net/knowledge/ir/index.php) to learn about IR remote.

## Sending IR code to dongle in Uint8Array

* The first byte sets the carrier frequency = 3333 / (n - 1) kHz
* The second byte sets the bit width. It is the number of carrier cycle in a bit.
* The rest are the bit stream data.
* [00] = stop IR stream
* [0x80] = loop back n bytes conditionally. n is stored in the following byte.
* Send an empty Uint8Array to stop looping.
* [0bxxxxxxx0] = bitmap, MSB out first and always ends in '1'
* [0bxxx10000] = "xxx1"
* [0bxnnnnnn1] = 'nnnnnn' numbers of x
* [0b00001001] = 4 numbers of 0 = "0000"
* [0b10001101] = 6 numbers of 1 = "111111"

## Point your remote to the Dongle

* Send an empty string to dongle to initiate IR LEARN MODE.
* Return Uint8Array of MARK/SPACE in unit of 19.2 us
* The array start with MARK and then SPACE alternatingly
* For MARK/SPACE shorter than 128 units takes only one byte with MSB = 0
* For MARK/SPACE longer than 127 units takes two bytes, first byte MSB = 1, the value is calculated to [byte1] + ([byte2] - 1) * 127

## Text Frame Handling

* Zero length string: initiate IR LEARN MODE
* String begins with `AT+CWJAP`: pass to ESP01
* All other strings shall be echoed back to client
* String length shall be less than 120 because of buffer size limit

## Buffer size is 120 byte

* The initial design is for ATTINY414 which has only 256 bytes SRAM.
* ATTINY414 cannot accommodate both remote and learner codes.

## Onboard Button

* click button to issue command `AT+CWJAP="SSID","PASSWORD"` to ESP01

## ESP01 Setup

```
AT+CWMODE=1
AT+CWJAP="ssid","password"
```

## ESP01 FIRMWARE

```
esptool --port /dev/ttyUSB0 --baud 460800 write-flash -z 0x0 Ai-Thinker_ESP8266_DOUT_8Mbit_v1.5.4.1-a_20171130.bin 
```
