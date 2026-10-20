/* Question bank: answer keys, questions from exams 1–24, explanations, topics */
// answer key from the booklet (Hebrew letters: א=A ב=B ג=C ד=D ה=E ו=F); row = question, column = exam
const KEY_ROWS = [
"ב ד ב ג ב ג א ג ג ב ה ב ב א א ד ב ב",
"ב א ב ב ב ב ג א א ב ד א ב ב ג ד ב ב",
"ד ג ג ג ד ג ד ב ב ג ב א ג ב ג ב ג ג",
"ג ד ב ג ב ג א ג ב א ד ג ג ד ב ד א א",
"ג ב ב ד ג ד ד ג א ב ב א ד ג ג ב ב ב",
"ג א ד ד ג א ג ב ב ב ג ג א ד ג ג ב ג",
"ג ב א א א ד ג ג ג ג א ב ד ב ד א ג ג",
"ב ב ד א ב ג א ב ג ג ג ד ג ג ג ג ג ד",
"ב א ב ג ג א ב ב ב ג ד ד ב ד ב ד ג ד",
"ב ג ב ג ב א ד ג ג ד ג ג א א ו ג ד ב",
"ד ב א ב ב ג ד א א ג ג ג ג ג ב ב ג ב",
"ב ד ג ד ב ג א ב ב ד א ב ג א ד א ד ב",
"ג א א ג ג ד א א א ד ג ב ד א ו ג ד ג",
"ג א ד ג ג ב ד ג ג ד ב ב ב ב ד ג ד ג",
"א ב ב א א ב ג ב ד ג א ג ב ב ב ב ג א",
"ג א א ד ג א ג ג ג ג ב ג א ב א ב ג ג",
"ג ב ג ד ג ג ד ג ג ב ד ד א א ה ד ב ד",
"א ב ד ב א ד ב א א ב ד ג ד ד א ב ב א",
"ד ג ב ד ד א ד ג ג ד ד ד א א א ג ב ב",
"ב א א ג ב ד ד ג ד ג ה ב ד א ב ד ג ב"];
// exams 19 onward: answers listed per exam, one letter per question
const KEY_EXTRA = {
  19: "ABCACDCCCCDBCADCBCCA",
  20: "DBCBAAAABBBABBADDAAC",
  21: "CDABABBDBDCDCCABDDDC",
  22: "BACABCDBABACADBAACDD",
  23: "CCAADAACDACAABBBBDDCCBBDABDADDAADCDBBA",
  24: "BBDBAD"
};
const KEY = "אבגדהו";
const L = "ABCDEF";

// one question per line: text|option|option...  ("=E.Q" reuses an identical question, "~" = line break)
const RAW = [
// 1
`Which feature will you NOT find in a 406 MHz satellite beacon?|Transmits a homing signal on 121.5 MHz|An audio homing signal|Emergency transmission on 406.025 MHz|Automatic release and float-free mechanism
The radiotelephone urgency signal|MAYDAY|PANPAN|SECURITE|SEELONCE FEENEE
Which publication should a GMDSS operator consult regarding communication procedures in distress?|IMO recommendations|The manufacturer's manuals|Ministry of Transport procedures|ITU procedures
Distress messages are:|Meteorological warnings|Navigational warnings|Man overboard|All answers are correct
How will the station controlling the distress announce the end of the distress situation?|It will use the term MAYDAY PRUDONCE|It will announce No Further Assistance Required|It will use the term SEELONCE FEENEE|It will send a DSC cancellation of the distress on CH70
Which VHF radiotelephone working channel would you propose to Haifa coast station to connect a call to a shore subscriber?|CH06|CH70|CH24|CH22
What determines VHF range?|The transmission channel|Receiver sensitivity|B + D are correct|The height of the ship's transmitting antenna
The radio beacon (EPIRB) fell overboard and was lost. Which steps will you take?|Transmit a false alert cancellation to the nearest MCC and log it|Transmit a false alert cancellation to the nearest coast station and log it|Transmit a DSC urgency message cancelling the distress via a coast station|Transmit a false alert cancellation on channel 16 to all stations in the area
A ship's call sign is:|NURIT|PYCH|VCH4|B + C are correct
How often does a NAVTEX station transmit per day?|Every 6 hours, each transmission 15 minutes at most|Every 4 hours, each transmission 10 minutes at most|4 times, each transmission as long as needed to complete the messages|6 times, each transmission one minute at most
What does AIS stand for?|Auto Insert Signal|Automatic Information System|Automatic Identity Signal|Automatic Identification System
What steps will you take after transmitting a false alert on VHF?|Send a DSC message on channel 70 cancelling the false alert|Compose a voice message cancelling the false alert and transmit it on channel 16|Transmit a voice message cancelling the false alert on channel 13|Transmit a voice message cancelling the false alert on channel 24
Urgency priority is used for:|Messages concerning safety of life at sea (SOLAS)|Messages dealing with important navigational notices|Messages containing information concerning the safety of a mobile unit or a person|Messages concerning on-scene communications
When is it justified to transmit the safety signal?|When the ship's security is at risk|When the safety of persons or property aboard is at risk|When there are meteorological or navigational warnings|When the NAVTEX system is not working
Under GMDSS, mandatory VHF-DSC and radiotelephone equipment must be tested at a minimum interval of:|Daily|Annually, by a Ministry of Transport representative|At the annual SOLAS survey|Monthly
Which equipment is used to send distress alerts and calls to specific stations?|NAVTEX|GPS|DSC CONTROLLER|Scanning watch receiver
Where is the radio log kept?|In the master's office|In the operator's cabin|At the station's operating position|Anywhere on the vessel
What is the purpose of the VHF Bridge to Bridge service?|Communication between ships to improve their navigational safety|Communication between ships and coast stations to improve navigational safety|Communication between yachts and marinas to improve navigational safety|Communication between ships during search and rescue (SAR)
On which channel(s) will you be contacted during search and rescue?|CH16 CH75|CH70 CH08|CH15 CH17|CH06 CH16
In which circumstances should a TR be transmitted?|When there is a danger to navigational safety|On entering and leaving port|In time of danger|A + B are correct`,
// 2
`What is meant by describing VHF transmission as line-of-sight range?|VHF communication is effective only with nearby stations within visual range|The height of the ship's antenna can affect the communication radius|Typical transmission range is 25 miles|B + C are correct
When a GMDSS operator on watch hears SECURITE 3 times, he can expect to receive:|A message concerning navigational safety or a meteorological warning|Safety of a vessel or a person in danger|A vessel needs immediate assistance|A coast station traffic list
Which of the following is allocated as the distress continuation frequency and must be in every survival craft?|Channel 6|Channel 13|Channel 16|Channel 70
The combination 428000500 is:|An MMSI of a vessel's DSC installation|An MMSI belonging to a country with MID 428|An MMSI of a group of DSC installations|A + B are correct
A VHF transmitter can reduce its transmit power to:|0.1 Watt|1 Watt|5 Watt|10 Watt
A distress alert transmitted via DSC must include:|MMSI, nature of distress, position and time of the last update|Nature of distress, vessel name, working channel with the coast station|Assistance required, call sign, nature of distress|MMSI, assistance required, last position (manual or from GPS) and time
Who determines the position of an EPIRB operating in the COSPAS-SARSAT system?|The MCC receiving the transmission from the LUT|The LUT receiving the transmission from the satellite|The satellite receiving the beacon calculates its position itself|The position is determined only by the EPIRB, provided it has integrated GPS
What does the following message heard on channel 16 mean?~All Ships x3 This is HaifaRadio x3 Traffic List on Channel 25|Haifa coast station has important safety traffic|Haifa coast station has traffic for several vessels and announces this through traffic lists it will broadcast on channel 25|Haifa coast station tells all vessels there is heavy traffic and they should listen on channel 25 for warnings|None of the answers is correct
Which of the following is a GMDSS functional requirement?|Bridge to Bridge communication|Reception of weather fax charts|Both of the above|None of the above
What is the purpose of AIS?|To replace the DSC system|To provide vessels with safety information in place of the NAVTEX system|To prevent traffic congestion, improve navigational safety and prevent collisions between vessels|To increase the effectiveness of the vessel's radar
What steps will you take after transmitting a false alert on DSC?|Send a DSC message on channel 70 cancelling the false alert|Switch off the set, compose a voice message cancelling the false alert and transmit it on channel 16|Transmit a voice message cancelling the false alert on channel 13|Transmit a voice message cancelling the false alert on channel 24
Which publications must a vessel carry under GMDSS for an international voyage?|List of Coast Stations|Alphabetical List of Ships|List of Call Signs and Numerical Identities|All of the above
Urgency priority is used for:|A request to evacuate an injured person|Messages dealing with important navigational notices|Messages containing information concerning the safety of a mobile unit or a person|Messages concerning on-scene communications
The radiotelephone safety signal is:|SECURITE repeated 3 times|SAFETY SAFETY SAFETY|PANPAN repeated 3 times|SECURITE SECURITE repeated 3 times
The code MA33 may indicate:|The call sign of a radiotelephone ship|A NAVTEX message identifier (navigational warning no. 33 from station M)|A coast station whose country identification characters are MA|The identifier of a DSC alert concerning a navigational warning
Regarding channels 15 + 17:|Only 1 Watt transmission is permitted on these channels|These channels are for navigational safety only|A DUPLEX vessel traffic control channel|A + B are correct
Which VHF channels will you use for on-board communication?|CH79 and CH11|CH15 and CH17|CH13 and CH15|CH11 and CH13
The expression PANPAN means:|A safety message requesting second priority|An urgency message requesting second priority|A distress message requesting first priority|An urgency message - man overboard
What does the DSC controller do when the operator does not enter updated information on activating distress alert mode?|It starts transmitting and sounds a beep that can only be silenced manually|It starts transmitting the distress alert, but rescuers will not be able to identify the ship's name, position and condition|The distress alert starts and the default data is transmitted|It calls the ship in distress to obtain its identity, position and condition
What is the function of the SART's audible alarm?|It tells survivors that help is probably nearby|It tells survivors the battery charge is low|It tells survivors when it switches to standby|It tells survivors a nearby vessel is signalling on DSC`,
// 3
`How can the SART's range be maximised?|Put the SART in the water immediately after activating it|Place the SART as high as possible|Operate the SART at maximum power|Calibrate the SART's transmit frequency using an indicator light
=2.8
On which of these channels is the maximum transmit power 1 Watt?|CH12 CH14|CH06 CH70|CH15 CH17|CH67 CH17
Which statement is NOT correct regarding the survival craft portable VHF?|Operates VHF/FM on channel 16|Maximum radiated power of 2 Watt|Simplex operation only|All answers are correct
What does AIS stand for?|Auto Insert Signal|Automatic Identification System|Automatic Information System|No correct answer
What should you do when a COSPAS-SARSAT EPIRB has been activated by mistake?|Inform all stations in the area of the false alert on channel 16|Inform the nearest LUT of the false alert on channel 16|Inform the nearest MCC of the false alert on channel 16|Inform a nearby coast station or RCC of the false alert on channel 16
=2.2
Which of these is allocated in GMDSS for VHF on-scene communication?|Channel 24|Channels 21 and 82|Channel 70|Channel 16
=2.18
Which expression indicates the end of a distress situation?|SEELONCE MAYDAY|SEELONCE FEENEE|SEELONCE DISTRESS|SEELONCE OUT
Which of the following is a GMDSS functional requirement?|Bridge-to-bridge communication|Reception of weather fax charts|Both of the above|None of the above
=1.17
How many safety levels are NAVTEX messages divided into?|Vital, Important, Routine|DISTRESS, URGENCY, SAFETY|All messages have the same priority unless it is distress|None of the answers is correct
In which of these events is safety priority normally used?|A crew member overboard|A serious medical condition involving a crew member|A + B|Events concerning navigational safety or a meteorological warning
=2.7
Which statement is correct regarding GMDSS equipment for a vessel sailing only in Area A1?|The vessel must be fitted with radio equipment able to initiate ship-to-shore distress alerts from the ship's bridge|VHF-DSC may be the only means of transmitting a distress alert|MF or HF DSC can meet the equipment requirements|HF SSB incorporating MSI messages can meet the equipment requirements
What is channel 16 used for?|For messages relating to NAVTEX broadcasts|For safety warnings by automatic calling|For distress, urgency, safety and calling communications|For weather messages
Urgency communications include:|Communications concerning assistance in towing a vessel restricted in her ability to manoeuvre|Communications concerning the medical condition of a crew member or passenger who needs medical assistance|Any request for medical evacuation|All answers are correct
What type of communication is the On Scene Communications service for?|Internal communication during the voyage|Communication between a mobile unit (vessel or aircraft) in distress and mobile stations providing assistance|Communication between ships on navigational safety|Communication permitted in ports only
The call sign of a ship's lifeboat will be:|SKTY26|SKTY2|S2KTY6|SKT626`,
// 4
`Immediately on leaving a marina or port I will make the following communication:|Contact all coast stations in the area to ask whether they have any traffic for me|Send a message to all vessels in the area that I am ready to receive traffic from them|Send a TR to the coast station nearest my point of departure|Send a DSC call to any coast station to test the equipment
How will you respond to a safety message about a firing range?|Send an acknowledgement to the station that transmitted the safety message|Record the message details in the station log and pass the message to the watchkeeper immediately|Transmit a PANPAN message to warn vessels in the area|No correct answer
On which channels will a SAR vessel communicate with a station in distress?|CH26 CH08|CH14 CH76|CH06 CH16|CH75 CH24
=2.10
Which channels are used for communication between fishing vessels and a station in Tel Aviv-Jaffa?|CH11 CH79|CH24 CH25|CH76 CH13|CH67 CH73
Which features may be found in a COSPAS-SARSAT satellite beacon?|Transmission on 121.5MHz for homing|Automatic release and float-free mechanism|Emergency transmission on 406.025 MHz|All answers are correct
DSC controllers have a function for internal testing without transmitting. How often should this test be done?|Once a day|Once a week|Twice a week|Once a month
Which statement is NOT correct regarding the SART?|It operates in S-Band, and its transmit power can be switched between Low and High|Its battery should allow 96 hours of operation from activation|Typical range when mounted one metre above sea level is 4-6 nautical miles|Both vessels and aircraft can home on it
The radar transponder (SART) transmits when:|Immediately once it is activated manually|The SART never transmits, it only receives radar signals|An X-Band radar within the SART's reception range is operating|The SART detects S-Band radar transmissions
You received a DSC urgency alert addressed to all stations on channel 70:|Acknowledge it immediately via DSC|Urgency alerts cannot be received on DSC|Switch to channel 16 and listen for the urgency message|Wait on channel 70 for acknowledgement from the RCC operating in the area
Which of these indicates the MMSI of a group of non-Israeli vessels?|002081111|048211111|042811111|366011111
The inter-ship channel designated for navigational safety:|CH11|CH06|CH17|CH13
The identification 023111428 refers to:|A coast station with MID 213|A group of Israeli vessels|A group of vessels with MID 231|A vessel belonging to a country with MID 023
At sea, a radiotelephone ship listens on channel 16:|Whenever a crew member is near the VHF transceiver|There is no need to listen, since DSC removes the need|24 hours a day|8 hours a day
Which statement about NAVTEX equipment is correct?|NAVTEX messages may relate to hurricane warnings|NAVTEX can receive and transmit messages at Vital, Important and Routine levels|You can ask a coast station to repeat a corrupted message whose error rate exceeds 4.9%|NAVTEX range is 20 to 40 nautical miles and covers only Area A1
Which of these is an on-board communication channel?|CH12|CH13|CH14|CH15
How do you avoid receiving irrelevant and unnecessary messages on NAVTEX?|Switch it on only when near the desired station|Switch it on according to the exact schedule of the station you want information from|Arrange it in advance with the desired coast station before the voyage|Program it to exclude unwanted stations/areas and unwanted message types
=1.12
The term Mayday Relay refers to:|A ship telling a station in distress that it is ready to help|A coast station relaying a safety message to all vessels in the area|An announcement of the end of distress via a coast station|Transmission of a distress message by a station that is not in distress
The following message is heard on CH16:~HaifaRadio This is Clement TR Over|Haifa coast station has important safety traffic and is passing it to the vessel Clement|Haifa coast station has traffic for a coast station in Cyprus|The vessel Clement tells Haifa coast station on CH16 that it intends to transmit its voyage details to it|Haifa is broadcasting a traffic list and the vessel Clement is on it`,
// 5
`=1.1
=1.2
The following channels are used for on-board communication:|CH12, CH20|CH12, CH14|CH67, CH73|CH15, CH17
Which statement is correct?|About every 90 minutes an Inmarsat communications satellite will appear above my vessel|The COSPAS-SARSAT satellite measures the Doppler shift and transmits this data to the LUT|The Doppler shift determines the EPIRB's identity|B and C are correct
=1.5
=1.6
On channel 26 HaifaRadio tells you:~Loreta this is HaifaRadio Your Turn is 4 Stand-by|Switch to D.W listening on CH16 and CH26 until the coast station calls you again|Switch to continuous listening on CH16 until the coast station calls you again|Disconnect and make new contact in 4 minutes|Listen on CH26 for 4 minutes, then disconnect and make contact again on the calling channel
The radio beacon (EPIRB) fell overboard and was lost. You will take these steps:|Transmit a false alert cancellation to the nearest RCC and log it|Transmit a false alert cancellation to the nearest coast station and log it|Transmit a DSC urgency message cancelling the distress via a coast station|Transmit a false alert cancellation on channel 16 to all stations in the area
The possible identifications of a vessel in communications are:|Vessel name, owning company, port of registry|Vessel name, MMSI, port of registry|International call sign, MMSI, vessel name|EPIRB serial number, MMSI, vessel name
=1.10
=3.5
=1.12
=1.13
=1.14
=1.15
=1.16
=1.17
=1.18
=1.19
=1.20`,
// 6
`An Inmarsat-E radio beacon operates in:|S-Band|X-Band|L-Band|C-Band
The means of communication between a towing ship and a towed yacht:|CH70|CH15, CH17|CH06|CH13
What steps will you take after a false alert transmitted on 406.025MHz?|Send a DSC message on channel 70 cancelling the false alert|Switch off the set, compose a voice message cancelling the false alert and transmit it on channel 16|Contact a nearby coast station and transmit a voice message cancelling the false alert|Switch off the Navtex and transmit a voice message cancelling the false alert on channel 12
To listen at the same time on a Public Correspondence channel and on the distress channel you should:|Use the Squelch function|Set the transceiver to Duplex reception|Use the function called Dual Watch|Operate the DSC and the VHF transceiver at the same time
When you have finished communicating with a station or stations and expect no reply, end with:|Over|Stand-By|Go Ahead|Out
A distress alert transmitted via DSC must include:|MMSI, nature of distress, last position and time|Nature of distress, vessel name, working channel with the coast station|Assistance required, call sign, nature of distress|MMSI, assistance required, last position (manual or GPS) and time
Which statement is correct regarding NAVTEX equipment?|It operates in S-Band|4209.5KHz is one of its possible receive frequencies|It operates as part of a global MSI service|B and C are correct
The combination 043805050 represents:|An MMSI of a vessel's DSC installation|An MMSI belonging to a country with MID 043|An MMSI of a group of DSC installations|B and C are correct
The Squelch function allows:|Eliminating interference from a nearby station|Eliminating the internal noise of the receiving system|Receiving one station only|Receiving a selected channel and channel 16 at the same time
Choose the correct statement:|PRUDONCE means limited, careful working is possible on CH16|SEELONCE in distress means the end of the distress situation|PRUDONCE means silencing an interfering ship|SEELONCE FEENEE means the controlling station silencing an interfering station
=2.10
NAVTEX range:|Depends on the height of the transmitting and receiving antennas|Around 20-25 nautical miles|Minimum 200 nautical miles, maximum 400 nautical miles|Minimum 400 nautical miles, maximum 800 nautical miles|A and B are correct
Choose the correct radio exchange:|Mayday Dorit x3 This is Sapir x3 Received Prudence Out|Dorit x3 This is Sapir x3 Received Mayday Over|Mayday Dorit x3 This is Sapir x3 Seelonce Mayday Over|Mayday Dorit x3 This is Sapir x3 Received Mayday Over
You are sailing on the yacht IRIS and made a routine call to the vessel SAMSON:|IRIS controls the communication|SAMSON controls the communication. Both vessels will work on CH08|SAMSON controls the communication. Both vessels will work on CH13|The larger vessel controls the communication, which takes place on a Duplex channel
=5.4
The expression MAYDAY is transmitted when:|There is danger to the life of one or more persons and immediate help is needed|The transmitting station is not in distress but is transmitting another vessel's distress call|A DSC distress alert is transmitted on CH70|A and C are correct
X-Band is intended for use by:|A radio beacon (EPIRB) operating with COSPAS-SARSAT satellites|NAVTEX in the international language|A radar transponder for homing|A radio beacon operating with Inmarsat satellites
With poor reception, how do you spell RQ 2 RT CALLS?|Require two RadioTelephone calls|Romeo Queen Two Romeo Tango Charlie Alfa Lima Sierra|Romeo Queen Bissotwo Tango Charlie Alfa Lima Lima Sierra|Romeo Quebec Bissotwo Romeo Tango Charlie Alfa Lima Lima Sierra
NAVTEX message PA21 was received corrupted with an error rate of CER=2%. You want to receive it again. What will you do?|Deleting the message identifier will cause it to be received again in 4 hours|Contact the nearest coast station for the details of the corrupted message|Contact the Navy on channel 11 for the missing information|Nothing can be done; wait for the next broadcast in 4 hours
Identify the coast station:|004560003|EilatRadio|042800001|A and B are correct`,
// 7
`What justifies cancelling a distress alert?|The distress alert was a false alert transmitted by any radio beacon|The distress alert was a false alert transmitted by the Navtex equipment|The distress situation has ended and all stations must be informed|A and B are correct
Which statement is NOT correct regarding the MSI service?|NAVTEX provides automatic MSI in the MF and HF bands|In sea Area A1 you should rely on MSI from NAVTEX|In sea Area A4 you should rely on MSI from the Inmarsat satellite system|MSI messages received on NAVTEX are divided into 3 priority levels
The word CONTROL is used in communication concerning:|Control of Distress communication|Control of On-Scene communication|Bridge-to-Bridge communication|On Board Communication
When a vessel receives a NAVTEX station about 300NM away, one can say:|The signal was received by ground wave propagation|The signal was received by space wave propagation|The signal was received by sky wave propagation|The signal was received by microwave propagation
003660033 calls 366428001 with emission class G2B. Which statement is correct?|A coast station is calling a ship station|The call is made with DSC equipment|Both stations have the same nationality|All answers are correct
What represents the first 3 letters of the alphabet when spoken phonetically?|Alfa Baker Choker|Alfa Baker Crystal|Alfa Bravo Charlie|Alfa Bravo Choker
At sea, a radiotelephone ship listens on channel 16:|Whenever a crew member is near the VHF transceiver|There is no need to listen, since DSC removes the need|24 hours a day|48 hours a day
After abandoning ship and once in the survival craft:|Place the SART high and throw the EPIRB into the water|Place the EPIRB high and throw the SART into the water|Do not activate the EPIRB and SART unless there is a ship nearby|None of the answers is correct
An EPIRB can be received by the DSC system provided the beacon transmits on:|L-BAND|CH70|The 406-406.1 MHz band|CH16
Which frequency/channel suits space wave propagation?|121.5MHz|CH12|518KHz|A and B are correct
What are the communication priorities under the Radio Regulations?|Vital, Important, Routine|Distress call, distress message, distress traffic|DSC activation, EPIRB activation, SART activation|DISTRESS, URGENCY, SAFETY, SHIP'S BUSINESS, ROUTINE
What does the following message mean?~HaifaRadio this is Tel-Aviv, TR Tel-Aviv left Haifa Bound Ashdod Over|Tel-Aviv left Haifa and will arrive at Ashdod|Haifa left Tel-Aviv and will arrive at Ashdod|Ashdod left Haifa and will arrive at Haifa|Tel-Aviv left Ashdod and will arrive at Haifa
Channel CH13 is used for:|Navigational safety between ships|Communication with marinas worldwide|Communication with the pilot on entering or leaving a port|None of the answers is correct
Safety messages are:|Meteorological warnings|Navigational warnings|A vessel not under command due to a breakdown|A and B are correct
State the MID of station 234280482|428|482|234|342
=1.5
In communication, to get a response from the other station, say:|Out|Stand-by|Received|Over
What is an abbreviated call on CH16?|A call in a busy area (where many shore and ship stations operate)|A call in which you call the station once and identify yourself twice|A short distress call while abandoning ship|A and B are correct
Which type of communication has the highest priority?|All types of messages related to NAVTEX|All types of urgent messages|A transmission from a VHF EPIRB|All types of communication made through DSC equipment
At the end of a NAVTEX message the indicator CER=6% appears|If the message remains valid it will be received again in 4 hours|6% of all the message's characters are wrong|The message identifier will not be stored in the receiver's memory|All of the above`,
// 8
`A vessel not under command will request a tow by:|Calling the RCC using SAFETY priority|Calling the MCC using URGENCY priority|Calling All Stations using second priority and the PANPAN code|Requesting a tow from any vessel in the area using URGENCY priority|C and D are correct
What does the NAVTEX message code PD00 mean?|The message from station P will be received by all receivers in the area regardless of how the operator has programmed them|Station D has no message but declares that it is operating|Station P has temporarily stopped operating|Station D has a Vital message for Area A1
The range of a NAVTEX station transmitting on 518KHz will be:|Worldwide coverage, since NAVTEX stations are spread along all coasts|200-400 NM|The range is limited to between 70 degrees north and 70 degrees south|About 20-30 NM
What steps will you take after a false alert from an Inmarsat-E radio beacon?|Send a DSC message on channel 70 cancelling the false alert|Compose a voice message cancelling the false alert and transmit it on channel 16|Compose a voice message cancelling the false alert and transmit it to a nearby coast station|Compose a voice message cancelling the false alert and transmit it to the main LES of the satellite region
Which VHF radiotelephone working channel would you propose to Istanbul coast station to connect a call to a shore subscriber?|CH20|CH12|Look up the working channel in the service publication (List of Coast Stations), or the coast station will assign the channel|CH16
Channels 06 and 16 serve as:|An inter-ship channel and an on-board channel|A search and rescue (SAR) channel and the distress channel|A Port Operation channel and a Ship Movements channel|A and B are correct
How often should the DSC be tested during a voyage?|Once per voyage|In preparation for an inspection by a licensed radio inspector of the local authority|Once a day, recorded in the station log|At every opportunity
Why should batteries be tested under load?|To check that the equipment connected to the batteries works|To make sure the batteries are actually fully charged. A no-load voltage reading can be misleading|To discharge the batteries before every new charge|Testing without load endangers the batteries
The position of a radio beacon transmitting on 406.025MHz is calculated by?|The LES of the satellite region|The LUT|The RCC nearest the incident|The MCC, which will pass the information to the RCC
Which channel will you use to pass a radiotelephone message longer than 2 minutes to another ship?|CH26|CH87B|CH06|CH16
How does the search team find out that the SART is transmitting in their immediate vicinity?|The SART dots on the radar screen begin to curve until they finally become circles centred on its position|The DSC set is triggered by the SART signals and responds with an audible alarm|The SART can give an approximate position within a radius of about 2 nautical miles, per the IMO standard|The SART signal appears as a target that appears and disappears, an effect of high swell on the SART
What does T.L mean in communication procedures?|Voyage details|Traffic lists from a coast station to ships|Telephone|A dangerous list of the vessel
Only SIMPLEX is used on these channels:|CH06 CH16|CH26 CH27|CH24 CH25|B and C are correct
The combination 231453432 is:|An MMSI of the DSC of a vessel belonging to a country with MID 314|An MMSI of the DSC of a vessel belonging to a country with MID 432|An MMSI of the DSC of a vessel belonging to a country with MID 231|An MMSI of the DSC of a vessel belonging to a country with MID 343
The radiotelephone urgency signal is:|PRUDONCE|PANPAN|SECURITE|URGENTLY
Which statement is correct regarding a COSPAS-SARSAT radio beacon?|It operates in L-Band|It operates in X-Band|It uses the Doppler effect|It operates in the 156-174 MHz band
=1.5
What is meant by On Board Communication?|Two VHF transceivers linked together on the same vessel|Search and rescue communication|Emergency equipment that operates automatically in distress|Communication channels for AIS
Which equipment is used to send distress alerts and calls to specific stations?|NAVTEX|X-Band radar|DSC Controller|S-Band radar
A lighthouse has stopped working. As a result a message of this type will be transmitted:|DISTRESS, to warn of a hazard dangerous to vessels|URGENCY, to warn that vessels without the lighthouse marking are effectively not under control|SAFETY, to warn of a danger to navigational safety|ROUTINE, to give a routine notice about a shore installation that is not working`,
// 9
`Distress messages are:|Meteorological warnings|Navigational warnings|Man overboard|An injured person|C and D are correct
=8.2
The range of a NAVTEX station transmitting on 518KHz will be:|4000 NM|200-400 NM|By regulation it must be exactly 400 NM|A maximum range of about 40 NM
What steps will you take after you transmitted a false alert on DSC?|Send a DSC message on channel 70 cancelling the false alert|Compose a voice message cancelling the false alert and transmit it on channel 16|Transmit a voice message cancelling the false alert on channel 13|Transmit a voice message cancelling the false alert to the RCC on a working channel
Which statement is NOT correct regarding the survival craft portable VHF?|It operates Simplex on 156.525 MHz (channel 70) and at least one other channel|Watertight to a depth of 1 metre for at least 5 minutes|Minimum effective radiated power of 0.25 Watt|All of the above
=8.6
=8.7
When is it justified to transmit a safety call?|When a sick person is in a condition that endangers his safety|Only coast stations may transmit the safety signal|When there are meteorological or navigational warnings|When the NAVTEX system is not working
=8.9
Which channel will you use to pass a radiotelephone message longer than 2 minutes to another ship?|CH26|CH12|CH06|CH16
How does the search team find out that the SART is transmitting in their immediate vicinity?|The SART dots on the radar screen begin to curve until they finally become circles centred on its position|The DSC set is triggered by the SART signals and responds with a two-tone alarm|The SART can give an approximate position within a radius of about 2 nautical miles, per the IMO standard|The SART signal appears as a flashing target at the end of the nearest arc
What does T.L mean in communication procedures?|Voyage details|Traffic lists from a coast station to ships|Telephone|Stop transmitting
=8.13
=8.14
Who will transmit the following message: Dalia SEELONCE MAYDAY|The coast station controlling the distress|A ship in distress (that controls the distress) silencing the station Dalia|Dalia is the ship in distress, silencing all interfering stations|A and B are correct
Which statement is correct regarding a COSPAS-SARSAT radio beacon?|It operates in L-Band|It operates in X-Band|It uses the Doppler effect|It uses range measurement
=1.5
What is meant by On Board Communication?|Two VHF transceivers linked together on the same vessel|Search and rescue communication|A VHF set on a vessel communicating with any station|A VHF set on a vessel communicating with any coast station
=8.19
What does DSC stand for?|Direct Selective Command|Equipment for transmitting and receiving homing signals in distress|Duplex Selective Calling|Digital Selective Calling`,
// 10
`What justifies cancelling a distress alert?|The distress alert was a false alert transmitted through the NAVTEX system|The distress alert was a false alert transmitted by the DSC equipment|The distress situation has ended and the stations must be informed|A and B are correct
Which expression is correct for urgency traffic?|SEELONCE PANPAN|PANPAN ALL STATIONS|PRUDONCE MEDICO|MEDICO SECURITE
What represents equipment for receiving Maritime Safety Information?|The DSC system via the MMSI|A radar receiving a SART|A NAVTEX receiver tuned to 518 KHz|All answers are correct
You made a routine call to a coast station on CH70 and got no answer. You will call the coast station again after:|5 minutes|5 seconds|2 minutes|3 minutes
What could the combination PC21 mean?|A DSC alert identifier|A NAVTEX message identifier|The official identification mark of a satellite radio beacon|Message no. 21 for Public Correspondence
The distance between NAVTEX transmitter D in Navarea 3 and NAVTEX transmitter D in Navarea 2 will be:|At least 400NM|At least 800NM|Between 200NM and 400NM|The distance between these transmitters does not matter, because they work on time sharing
At sea, a radiotelephone ship listens on channel 16:|Whenever no crew member is near the VHF equipment|16 hours a day|24 hours a day|8 hours a day
What creates the need to transmit a distress relay (Mayday Relay) through the NAVTEX network?|It is the only way the RCC can communicate with ships in the area|It is a way to minimise DSC congestion during distress|Extending the search for survivors beyond VHF communication range|A and B are correct
What is the correct phonetic spelling of PUB30?|PAPA UNA BRAVA TERRATHREE ZERO|PENTA UNA BRAVO THREE ZERO|PAPA UNIFORM BRAVO TERRATHREE NADAZERO|PAPAPENTA UNA BRAVO TERRATHREE NADAZERO
The following port operations channel is first priority in Simplex:|CH10|CH20|CH60|CH12
Choose the correct statement:|To check the batteries, switch off all the station's equipment and then check their terminal voltage|To check the batteries, switch on all the station's equipment and then check the specific gravity of each cell|To check the batteries, operate all the station's equipment (VHF transmitting) and then check their terminal voltage|Fast, high-current charging all the time is recommended to extend battery life
Which of these will you transmit with first priority?|An announcement of the end of a distress situation|A pirate attack|Man overboard|All answers are correct
Channel CH13 is used for:|Navigational safety between a coast station and a vessel|Communication with marinas worldwide|Communication with the pilot on entering or leaving a port|None of the answers is correct
Safety messages are:|A blizzard warning|A notice that a lighthouse is not working|An engine failure on a ship at sea|A and B are correct
Which of these combinations indicates the MMSI of a group of vessels?|0366811|04280111|036611111|0428011111
=1.5
Two stations established communication on channel 25:|The communication is for AIS purposes|The communication is between a ship station and a coast station|The communication is between two ship stations|The communication is between the port authorities and a ship station
=7.18
The expression PANPAN means:|A message about the illness or injury of a crew member|An urgency message requesting second priority|A distress message requesting first priority|A and B are correct
The electromagnetic radiation of the SART propagates by the principles of:|Sky wave propagation|Ground wave propagation|Space wave propagation|Digital wave propagation`,
// 11
`Which of the following identifications identifies a coast station?|004280001|RejekaRadio|Haifa|A + C are correct|A + B are correct
During your watch you heard SECURITE said 3 times on CH16. This means?|A coast station is announcing storm danger|A coast station is announcing that a sea mine has been found in the area|A mobile unit needs a tow|A + B are correct|B + C are correct
You are on a vessel in distress and want to contact a search aircraft circling above you. Which channel will you use?|CH70|CH06|CH13|CH12
What information does the NAVTEX system provide?|Maritime Safety Information|Navigational warnings, meteorological warnings and SAR-related information|Distress communication and SAR information between ships|A and B are correct
How can a coast station widen the circle of assistance to a ship in distress beyond Area A1?|Ask all vessels via DSC to transmit a DISTRESS RELAY|Broadcast a Vital-level NAVTEX message|Itself transmit a distress call and message on VHF DSC|B and C are correct
The SART will be in receive-only mode when:|It is thrown into the water and starts working automatically|It is activated manually and an X-Band radar is operating nearby|It is activated manually and no X-Band radar is operating nearby|The SART only transmits
Which communication system provides data for avoiding collisions in busy traffic areas?|AIS|COSPAS-SARSAT|EPIRB|NAVTEX
The international radiotelephone distress call consists of:|DISTRESS x3 THIS IS NAME x3|DISTRESS x3 THIS IS CALL/SIGN x3|MAYDAY x3 THIS IS NAME x3|MAYDAY ALL STATIONS x3 THIS IS NAME x3
A distress message will be transmitted by a station that is not in distress:|When the vessel in distress is not able to transmit distress|When the master or person responsible on a vessel not in distress so decides|When the person responsible at the coast station considers further help necessary|Any of the previous situations can justify a distress relay
The vessel ALBERTA called your vessel on channel 16. Who will set the working channel to continue on?|The vessel closest to shore|The vessel ALBERTA|Your vessel|The smaller vessel, because it has fewer means of communication
The station called LUT is a communication link in a system related to:|MSI|Automatic Identification System|Locating and identifying a radio beacon|Global Position System
Which of these cases suits urgency?|A woman giving birth aboard who needs assistance from shore|A notice of a dangerous tropical storm|Pirates trying to take over the vessel|A and C are correct
Bridge to Bridge communication is held on channel(s):|CH15 and CH17|CH70|CH13|CH11 and CH79
Which VHF radiotelephone working channel would you propose to Ashdod port for a conversation with the port authorities?|CH13|CH14|CH26|CH22
What does the following message heard on CH16 mean?~All Ships x3 this is HaifaRadio x3 Navigation Warning CH25|Haifa coast station has important safety traffic|Haifa coast station has traffic for several vessels and announces this through traffic lists it will broadcast on channel 25|Haifa coast station warns vessels not to transmit on channel 25|No correct answer
What do the frequencies/channels 156.8MHz, 121.5MHz and CH06 have in common?|Channels that work with the COSPAS-SARSAT system|Emergency channels during search and rescue in which aircraft also take part|Channels used for homing during search and rescue|They have nothing in common
=9.15
The frequency 518 KHz is used for:|A radio beacon (EPIRB) operating with COSPAS-SARSAT satellites|Broadcasting NAVTEX messages in the international language|Broadcasting within the Maritime Safety Information service|B and C are correct
Which statement is correct regarding DSC equipment?|It operates Simplex on channel 70 and at least one other channel|It decodes and encodes digital transmissions in emission class G2B|Maximum effective transmit power of 25 Watt|All of the above
To whom can the RCC transmit a Distress Relay Alert?|All stations|A group of ships or a specific ship|A defined area|A + B are correct|A, B and C are correct`,
// 12
`During the voyage, transmit and receive tests of the survival craft portable VHF should be done:|Once a day|Once a week|Once a month|Once per voyage
VHF channel 70 is used for:|A DSC channel for distress, urgency, safety and calling alerts|A channel that replaces VHF channel 16 for routine traffic when channel 16 is busy|Announcing the cancellation of distress situations|A, B and C are correct
What is an abbreviated call on VHF channel 16?|You call the station once and identify yourself twice|You call the station twice and identify yourself once|You call the station twice and identify yourself twice|A call made by DSC
In GMDSS, sea Area A1 is:|Sea coverage of 200-400 nautical miles from the coast|Sea coverage of 60 miles from the coast|The sea area within VHF coverage of at least one coast station|Each country may decide the size of Area A1
NAVTEX safety levels are ranked in this priority order:|Vital, Important, Routine|Important, Vital, Routine|Routine, Vital, Important|Vital, Routine, Important
A station in distress that wants to silence a station or stations interfering with its distress traffic will use these words:|MAYDAY SEELONCE|MAYDAY DISTRESS|SEELONCE MAYDAY|SEELONCE DISTRESS
How will you act at the end of an urgency situation you transmitted to all stations in the maritime service?|End it with a DSC message|End it with a message on VHF channel 16|End it with a DSC call followed by a message on VHF channel 16|There is no obligation to announce the end of an urgency situation
The SART battery will keep the device in receive mode (STAND BY) for:|Eight hours|Forty-eight hours|Seventy-two hours|Ninety-six hours
The transmission range of most NAVTEX stations is:|Usually 50-100 nautical miles|Usually over 1000 miles in daytime|Limited to about 30 miles from the coast|Usually 200-400 nautical miles
The following VHF channels are inter-ship (INTERSHIP) channels:|CH12 and CH06|CH12 and CH08|CH06 and CH08|CH14 and CH12
What does Dual Watch mean in maritime communication procedures?|Simultaneous reception of channel 16 and a selected working channel|Simultaneous reception of the working frequencies of two different stations|Alternate listening to channel 16 and a selected working frequency|Simultaneous transmission on channel 16 and a selected working frequency
In the international phonetic alphabet, UN2MO is:|UNION NOVEMBER TWOBISSO MIKE OSLO|UNIFORM NOVEMBER BISSOTWO MIKE OSCAR|UNIFORM NOVEMBER TWOBISSO MIKE OSCAR|UNION NOVEMBER BISSOTWO MIKE OSLO
The MMSI of a group of vessels will be:|002470022|024700222|247000222|000247222
Regarding VHF channel 15:|A channel for navigational safety only|There is a power limit of one Watt on this channel|A channel for vessel traffic control|A channel for public correspondence
Which of these cases suits safety (SAFETY) messages?|A person fell into the water|A request for medical help|A notice of an approaching storm in the Middle East|All answers are correct
A coast station received your distress alert transmitted by DSC. On which channel will the coast station acknowledge receiving it?|Channel 6|Channel 13|Channel 16|Channel 70
The term MAYDAY RELAY refers to:|A notice of the temporary end of a distress situation|A ship in distress transmitting its distress message a second time|A ship asking a station in distress to repeat its distress message|Transmission of a distress message by a station that is not in distress
The term PRUDONCE indicates that:|The distress situation has ended|The distress situation has not ended and all communication except distress communication is forbidden|Careful working on the distress channel is allowed even though the distress has not ended|Only stations taking part in the distress traffic may work on the distress channel
In ordinary radio communication between a ship station and a coast station, the station controlling the communication is:|The calling station|The called station|The ship station|The coast station
The primary aim of GMDSS is:|Efficient and cheap general communication|To automate and improve emergency communications in world shipping|To provide more means for efficient communication with the shipping company|To allow vessels more efficient control of SAR situations`,
// 13
`A maritime radar transponder operates in:|S-Band|X-Band|L-Band|C-Band
The voice channel(s) between a towing ship and a towed yacht:|CH70|CH15 and CH17|CH06|CH73
=6.3
=6.4
=6.5
=6.6
=6.7
=6.8
An EPIRB can be received by the DSC system provided the beacon transmits on:|X-Band|Channel 70|An EPIRB cannot be received by DSC equipment|121.5MHz
=6.10
=2.10
What is the NAVTEX range?|Depends on the height of the transmitting and receiving antennas|Around 20-25 nautical miles|Minimum 200 nautical miles, maximum 400 nautical miles|Minimum 400 nautical miles, maximum 800 nautical miles
Choose the correct radio exchange:|Mayday Dorit x3 This is Sapir x3 Received Prudonce Out|Dorit x3 This is Sapir x3 Received Mayday Over|Mayday Dorit x3 This is Sapir x3 Seelonce Mayday|Mayday Dorit x3 This is Sapir x3 Received Mayday Over
=6.14
=5.4
The expression MAYDAY is transmitted when?|There is danger to the life of one or more persons and immediate help is needed|The transmitting station is not in distress and is transmitting another vessel's distress call|A DSC distress alert is transmitted on CH70 and the radiotelephone is used after it|A and C are correct
When will the NAVTEX receiver reject a particular message?|The serial number and message type from that station have already been received|The message arrived with an error rate above 5%|The message identifier ends in the digits 00|The message type refers to a message marked with the letter Z
=6.18
NAVTEX message PA21 was received corrupted with an error rate of CER=2%. You want to receive it again. What will you do?|Deleting the message identifier will cause it to be received again in 4 hours|This error rate is acceptable, so there is no need to wait for the next cycle in 4 hours|This error rate will make the receiver break in again in 4 hours|Nothing can be done; wait for the next broadcast in 4 hours
=6.20`,
// 14
`Which system provides accurate position information to GMDSS?|GPS|COSPAS-SARSAT|EPIRB|GEO
=1.2
The frequency 490KHz is used for:|A radio beacon (EPIRB) operating with COSPAS-SARSAT satellites|Broadcasting NAVTEX messages in the national language|Broadcasting NAVTEX messages in English|This frequency is not used in GMDSS
What are the reasons for sending voyage details to a coast station?|More efficient routing of EPIRB alerts of all kinds|Improved search and rescue performance|Navy standing orders to improve security|Improved routing of traffic
=4.10
Identify the coast station:|HAIFA|DakarRadio|005673333|B and C are correct
At sea, all equipment (except survival craft equipment) requires proof of operability by:|A daily test|By A or C|Routine operation of the equipment|A test at least every 48 hours
=1.5
The combination DSC20 spelled phonetically is:|DIGITAL SENSOR CALL BISSOTWO NADAZERO|DELTA SENSOR CHARLIE BISSOTWO NADAZERO|DOLPHIN SIERRA CHARLIE BISSOTWO NADAZERO|DELTA SIERRA CHARLIE BISSOTWO NADAZERO
Channel 13 is used for:|Navigational safety between ships|Communication with marinas worldwide|Communication with the pilot on entering or leaving a port|None of the answers is correct
=1.16
Which statement is NOT correct regarding the portable VHF?|It operates SIMPLEX on 156.525 MHz (channel 70) and at least one other channel|Watertight to a depth of 1 metre for at least 5 minutes|Minimum effective radiated power of 0.25 Watt|It must transmit on channel 16 and at least one other channel
=3.11
=1.12
=3.5
=3.1
=7.8
Which equipment is used in or near survival craft?|NAVTEX|Echo sounder|DSC|EPIRB
What does the following message heard on channel 16 mean?~All Stations x3 This is RotaRadio x3 Gale Warning on Channel 27|ROTA coast station announces it has a gale warning and will give the details on CH27|A ship station asks ROTA coast station whether it has a gale warning on CH27|ROTA coast station asks all stations whether they have information about a gale warning|ROTA coast station is ready to receive a gale warning from vessels on CH27
The use of CH16 is:|Radiotelephone distress, urgency, safety and calling channel|A DSC channel for distress, urgency and safety alerts|A channel that replaces CH70 in the GMDSS system|A channel for broadcasting navigational notices and weather reports`,
// 15
`Seaweed calls Damien in Area A1 within a coast station's coverage. Which station controls the traffic?|Damien|Seaweed|The coast station in the area|B and C are correct
The term Bridge to Bridge communication is used for:|Communication during a distress incident|Internal communication|An inter-ship channel for navigational safety|A communication channel between vessels
What is safety communication?|A radiotelephone warning followed by the word PANPAN|Traffic concerning the health, welfare and protection of the seafarer|Any transmission indicating that a station is preparing to transmit an important navigational or weather warning|All answers are correct
Which message-type designators cannot be rejected or disabled by programming the NAVTEX receiver?|A,B,D,Z|A,B,D,L|A,B,D,L,E|A,B,D,E
Transmitting a Transit Report requires which priority?|URGENCY|DISTRESS|ROUTINE|SAFETY
The term SBM means:|Simplex Bi-directional Mode|Sea Basic Maintenance|Shore Based Maintenance|Sea Born Maintenance
Which of these identifications is NOT a coast station?|003661234|VigoRadio|4XO|Haifa
In which publication do the medical codes appear?|ITU List of Coast Stations|GMDSS Radio Logbook|International Code of Signals|No correct answer
Which statement is NOT correct regarding a GPIRB?|A constellation of at least 4 GEO satellites is needed for global coverage (70N-70S)|The beacon's position is determined by Doppler shift|Availability for receiving the beacon is up to 90 minutes when used above latitude 70 degrees|The accuracy of the beacon's position depends on the GPS accuracy at the moment it is activated
Which of these channels/frequencies provide homing for SAR purposes?|CH06|121.5MHz|9GHz|406.025 MHz|B and D are correct|B and C are correct
All transmissions on CH16 (except distress) are limited to:|A minimum|A minimum, and not more than one minute|A minimum, and not more than 10 seconds|As long as needed
Choose the correct channels assigned to coast stations for public correspondence:|20, 21, 22, 23, 24, 25|12, 14, 20|16, 70, 06, 08|24, 25, 26, 27, 28
By what means will you initiate a distress alert on a vessel in Area A1?|VHF CH16|DSC CH70|GPIRB|SART|AIS|B and C are correct
What are the uses of a portable VHF transceiver?|Communication between a ship's survival craft and the mother ship|Communication between survival craft and ships or rescue units|On-board communication on suitable channels and power levels|All answers are correct
Which of these are considered AIS data?|Routine data, Important data, Vital data|Static data, Dynamic data, Voyage data|Urgent data, Non-urgent data, Safety data|None of these are AIS data
By what means can a vessel in Area A1 receive a distress relay?|A voice distress relay on CH16 from any vessel or coast station, DSC, Navtex|DSC, Navtex, SART|DSC, Navtex, AIS|DSC, Navtex, EPIRB/GPIRB
What are the main uses of VHF CH06?|Exchanging information between vessels and aircraft in a search and rescue area|Initiating a distress alert by the vessel in distress|Exchanging information and public traffic between vessels (Intership)|Receiving MSI if preceded by an announcement on CH16 by the coast station|A and C are correct
When a DSC distress alert is sent (CH70), stations within DSC range will receive these details:|MMSI of the vessel in distress, nature of distress, time and position, call priority|MMSI of the vessel in distress, nature of distress, time and position, call priority, vessel name|Name of the vessel in distress, nature of distress, time and position, call priority|MMSI of the vessel in distress, vessel name, time and position, call priority
Announcing a safety message by DSC requires switching to which follow-on channel?|CH16|156.525MHz|CH06|CH13
What does MCC stand for?|Maritime Controlling Centre|Mission Control Centre|Marine Coordinating Commander|Marine Coastal Crew`,
// 16
`Identify the coast station among these identifications:|002130001|RomaRadio|Haifa|A + B are correct
During your watch you heard PRUDONCE said 3 times. This means:|A navigational or meteorological warning will follow|A station is preparing to transmit a false alert cancellation|A mobile unit needs immediate help|No correct answer
You are on a vessel in distress and want to contact a search aircraft circling above you. You will use channel:|70|06|13|12
What information does the Navtex system provide?|Maritime safety information defined by 3 priority categories|Navigational warnings, meteorological warnings and SAR-related information|Distress communication between ships|A + B are correct
Which maritime devices can searchers home on during search and rescue?|Navtex + AIS|SART + EPIRB|DSC|DSC + NAVTEX
=11.6
In a distress alert, the DSC automatically repeats the alert at intervals of:|Every 3.5-4.5 minutes|2 minutes, 2 minutes, 3 minutes, and so on|5 minutes and then 15 minutes|Once every 90 minutes
=11.8
=11.9
=11.10
You are on watch and heard a cancellation of a false distress alert from a ship station near you:|Call the station that sent the cancellation and acknowledge receipt|Record the false alert cancellation in the station log and carry on as normal|Relay this message to a nearby coast station|A and B are correct
=11.12
=11.13
Which of these portable devices has a lithium battery meant to run it for at least 96 hours?|EPIRB|Portable VHF|SART|GPIRB
Your vessel is disabled (not under command) but is in no clear and immediate danger. What will you do?|Contact a coast station and ask for immediate evacuation|Transmit a tow request on channel 16 addressed to all stations|Any loss of control of a vessel requires a distress alert|All answers are correct
The AIS works together with the:|Navtex|DSC|VHF transceiver|EPIRB
Who will transmit the following message: Yana Seelonce Mayday?|The coast station controlling the distress|A ship in distress (that controls the distress) silencing the station Yana|Yana is the ship in distress, silencing all interfering stations|A and B are correct
The frequency 518 kHz is used for:|A radio beacon (EPIRB) operating with COSPAS-SARSAT satellites|Broadcasting Navtex messages in the international language|The new GPIRB frequency|The AIS system
Which of these devices operates in X-Band?|NAVTEX|AIS|SART|GPIRB
To whom can the RCC transmit a Distress Relay Alert?|All stations|A group of ships or a specific ship|A defined area|A, B and C are correct`,
// 17
`What justifies cancelling a distress alert?|The distress alert was a false alert transmitted by the SART|The distress alert was a false alert transmitted by the DSC equipment|The distress situation has ended and all stations must be informed|A and B are correct
Which expression is correct for urgency traffic?|SEELONCE PANPAN|PANPAN ALL STATIONS|PRUDONCE MEDICO|MEDICO FALSE ALERT
Which of these represents equipment for receiving Maritime Safety Information?|The DSC system via the MMSI|AIS|A NAVTEX receiver tuned to 518 kHz|Portable VHF
=10.4
A possible meaning of the group PC21:|A DSC alert identifier|A NAVTEX message identifier|The official identification mark of a satellite radio beacon|Message no. 21 concerning Public Correspondence
The distance between NAVTEX transmitter D in Navarea 3 and NAVTEX transmitter D in Navarea 2:|At least 400 nm|At least 800 nm|Between 200 nm and 400 nm|The distance between these transmitters does not matter, because they transmit in different Navareas
At sea, a radiotelephone ship keeps watch on channel 70:|Whenever no crew member is near the VHF equipment|16 hours a day|24 hours a day|8 hours a day
=10.8
=10.9
The channel for communication between vessels and port authorities in SIMPLEX is:|CH13|CH17|CH24|CH12
Choose the correct statement:|To check the batteries, discharge them and then check their terminal voltage|To check the batteries, switch on all the station's equipment and then check the specific gravity of each cell|To check the batteries, operate all the station's equipment (VHF transmitting) and then check their terminal voltage|Fast, high-current charging all the time is recommended to extend battery life
=10.12
Channel CH13 is used for:|Navigational safety between a coast station and a vessel|Communication with marinas worldwide|Communication with the pilot on entering or leaving a port|No correct answer
=10.14
=10.15
=1.5
=10.17
What is an abbreviated call on CH16?|A call with safety priority and urgency priority|A call in which you call the station once and identify yourself twice|A short distress call while abandoning ship|A and B are correct
The expression PANPAN means:|A message about a fire drill warning|An urgency message requesting second priority|A distress message requesting first priority|A and B are correct
The electromagnetic radiation of the SART propagates by the principles of:|Sky wave propagation|Ground wave propagation|Space wave propagation (microwaves)|Digital wave propagation`,
// 18
`In which publication will you find the name of the vessel with the code 227888022?|Admiralty VOL.5|List of call signs and numerical identities|Admiralty VOL.9|List of radio determination and special service stations
=1.2
What is a hydrometer?|A device that measures the amount of drinking water in the vessel's tanks|A device that measures air humidity|A device that measures the specific gravity of the battery electrolyte|The radio beacon's hydrostatic release mechanism
During an ongoing distress incident the following is heard on the radio:~All Stations Seelonce Mayday~What does it mean?|The controlling station is silencing stations that interfere with the distress traffic|The controlling station is ending the distress incident and releasing channel 16 for normal work|The coast station or RCC near the incident is asking another vessel in the area for help|A notice to all vessels that limited, careful work on channel 16 is allowed
What is the order of magnitude of position accuracy for a COSPAS-SARSAT beacon relying on the Doppler effect?|A radius of 5 to 50 metres|A radius of about 5 km|A radius of about 50 miles|A beacon defined as Class D allows GPS accuracy
Which VHF radiotelephone working channel would you propose to a ship station to give way?|CH06|CH70|CH13|CH15
What determines VHF range?|The transmission channel|The height of the shore transmitting antenna|B and D are correct|The height of the ship's transmitting antenna
A COSPAS-SARSAT radio beacon will be received by:|RCC|MCC|Leolut or Geolut|Leosar or Geosar
When calling the coast station of Napoli, use the expression:|Napoli Port|Napoli Station|Napoli Harbor|Napoli Radio
=1.10
=3.5
What steps will you take after transmitting a false alert on DSC?|Send a DSC message on channel 70 cancelling the false alert|Compose a voice message cancelling the false alert and transmit it on channel 16|Transmit a voice message cancelling the false alert on channel 13|Transmit a voice message cancelling the false alert on channel 24
=1.13
=1.14
=1.15
Which equipment is used to send distress alerts and calls to specific stations?|Navtex|AIS-SART|DSC Controller|EPIRB/GPIRB
Two yachts can communicate on these channels:|CH20, CH16, CH12|CH20, CH70, CH11|CH20, CH24, CH12|CH13, CH15, CH11
=1.18
Which maritime device/station does the identification 970881234 belong to?|AIS|AIS-SART|RADAR-SART|A search and rescue aircraft
In which circumstances should a TR be transmitted?|When there is a danger to navigational safety|On entering and leaving port|According to the security orders of the local authority|A and B are correct`,
// 19
`Which of the following channels/frequencies is associated ground waves?|518 kHz.|4209 kHz.|121.5 MHz.|Answers a and b are correct.
How should you respond to a safety message concerning a firing area?|Send acknowledgement of receipt of the message to the station that transmitted the safety message.|Check its relevance to your position, act accordingly, and record the details of the message in the radio log.|Transmit a PAN PAN message to warn all vessels in the vicinity.|Send acknowledgement of receipt of the message to the nearest RCC.
What is the purpose of the AIS system?|To serve as a substitute for the DSC system.|To provide vessels with safety information as a substitute for the NAVTEX system.|To enhance navigational safety and prevent collisions between vessels, mainly in areas of heavy traffic.|To increase the efficiency of the vessel's radar.
On which channels will a vessel receive information and docking instructions when entering a port?|CH12, CH14.|CH15, CH17.|CH16 only.|CH24, CH25, CH26, CH27.
According to the International Phonetic Alphabet, the combination PM 10 will be expressed as:|Ten o'clock in the evening.|Ten o'clock in the morning.|UNAONE NADAZERO PAPA MIKE.|UNAONE NADAZERO POST MERIDIAN.
What causes a SART to start transmitting?|Throwing it into the water.|Manual activation and mounting it in a high position.|An S-band radar operating within its receiving range.|An X-band radar operating within its receiving range.
A NAVTEX station transmitted at 20:40. When will its next transmission be?|23:40.|22:40.|00:40 on the following day.|02:40 on the following day.
Which maritime identification number identifies an AIS-SART of a vessel?|994282465.|428017655.|970580022.|009702204.
What is a shortened call on Channel 16?|A call using DSC.|A call using Dual Watch.|Calling the station once and identifying yourself twice.|Calling the station 3 times and identifying yourself once.
The reason that a NAVTEX receiver receives in Greek is:|Because the receiver is receiving on 4209.5 kHz.|Because the receiving vessel is near the Greek coast.|Because the receiver is receiving on 490 kHz.|Because the receiver is receiving on 518 kHz.
The SART battery has a continuous stand-by operating capacity of:|8 hours.|2 days.|3 days.|4 days.
The officer on watch received a DSC message carrying the category URGENCY:|He will acknowledge this message immediately by DSC.|He will wait for the T/R message on the follow-up channel, record the event in the radio log, and inform the person in charge of his vessel.|He will immediately give notice to proceed toward the vessel requiring assistance, after DSC acknowledgement.|He will immediately notify the RCC nearest to the incident, and record the details of the event in the radio log.
In communication, to end the communication with the other station, say:|Feenee.|End.|Out.|Over and Out.
What does IB03 indicate?|A NAVTEX message identification code from station I.|A NAVTEX message identification code from station B.|A vessel call.|The call sign of a coast station.
Which channel would you use for routine communication with another vessel?|Channel 75.|Channel 15.|Channel 76.|Channel 08.
Which of the following satellite constellations does not participate in EPIRB detection within MEOSAR?|The Galileo system.|The GNSS system.|The Inmarsat system.|The GPS system.
For what purpose should voyage details (TR) be transmitted?|To improve the establishment of communication from the vessel to shore.|To improve the establishment of communication when a coast station wishes to initiate contact with the vessel.|To avoid the need for DSC in routine calls.|To enhance the security measures of small vessels against terrorist and pirate attacks.
Which device determines the position of the SART?|The MCC station receiving the transmission from the LUT.|Marine radar operating in the S-band.|An AIS receiver operating in the VHF band.|Orbiting satellites.
What are the AIS channels?|CH75, CH76.|CH15, CH17.|CH87B, CH88B.|CH12B, CH14B.
Which of the following calls is not legal/legitimate?|PAN PAN, All Stations, this is MANUELA, 366567004, need NAVTEX message NA45, out.|MAYDAY, MANUELA, SEELONCE MAYDAY.|MAYDAY, MANUELA ×3, this is RENITA ×3, received MAYDAY, over.|SÉCURITÉ ×3, All Stations ×3, this is RCC Haifa ×3, navigational warning CH26.`,
// 20
`The word “Control” is useful in communications related to:|Distress communication|On-Scene communication|Bridge-to-Bridge communication|On-Board communication
Under what circumstances should TR be transmitted?|When there is danger to the safety of the sailing|When entering or leaving port|During distress situations|Answers a and b are correct
What are the AIS channels?|CH75 CH76|CH15 CH17|CH87B CH88B|CH12B CH14B
How can the range of a SART be maximized?|Place the SART in the water immediately after activation|Position the SART as high as possible|Activate the SART at maximum power mode|Calibrate the SART transmission frequency using the control lamp
What is the most important component of the GMDSS search and rescue system?|COSPAS-SARSAT satellites|DSC system|NAVTEX device|All answers are correct
On which of the following channels is using only SIMPLEX communication?|CH06 CH16|CH79 CH17|CH25 CH24|CH12 CH79
The following actions are permitted on Channel 70:|Alerting distress, urgency, and safety situations|Transmitting and receiving distress alerts by radiotelephone|Transmitting and receiving MAYDAY RELAY only|Transmitting distress cancellation messages only
What is the purpose of the Bridge-to-Bridge service on VHF?|Communication between ships to improve sailing safety|Communication between ships and coast stations to improve sailing safety|Communication between yachts and marinas to improve sailing safety|Communication between ships during SAR operations
Which device combines both transmission and reception of distress alerts in one device according to GMDSS?|COSPAS-SARSAT EPIRB|DSC device|All answers are correct|AIS SART
Which feature would NOT be found in a 406.025 MHz satellite beacon?|121.5 MHz homing transmitter|Audible homing signal|Emergency transmission on 406.025 MHz|AIS-band homing transmitter
What actions should be taken after transmitting a false DSC alert?|Send a DSC message on Channel 70 cancelling the false alert|Turn off the DSC device and prepare a voice cancellation message on Channel 16|Transmit a voice cancellation message on Channel 13|Transmit a voice cancellation message on Channel 24
When a GMDSS operator on watch hears “SECURITE” repeated three times, what information can be expected?|A navigation safety or meteorological warning|Safety of a vessel or person in danger|A vessel requiring immediate assistance|A coast station traffic list
A VHF transmitter can reduce transmission power down to:|0.1 watt|1 watt|3 watts|10 watts
Identify the group ship call sign among the following:|All stations|022211005|004280001|323777011
Into how many safety priority levels are NAVTEX messages divided?|Vital, Important, Routine|Distress, Urgency, Safety|All messages have equal priority unless distress-related|None of the above
What does DSC stand for?|Direct Selective Command|Equipment for transmitting and receiving distress homing signals|Duplex Selective Calling|Digital Selective Calling
Identify the EPIRB identification signal among the following:|970010001|972050113|994286005|974280001
Radiotelephone equipment for use in a life raft station under GMDSS must include the following features:|Operation on CH16 E3F or E3G|Operation on CH70 DSC|Operation on 121.5 MHz|All the above
Which of the following situations is classified as urgency?|Request for medical assistance|Warning of a dangerous tropical storm|Man overboard|All answers are correct
Which of the following controls may reduce reception range?|Setting the SQUELCH control to minimum|POWER control set to HIGH|Setting the SQUELCH control to maximum|Selecting SIMPLEX mode`,
// 21
`The coverage of stationary GEOSAT satellites for receiving a radio beacon is:|All sea areas, excluding Area A1 and Area A2.|Sea Area A4.|All areas between 70° North and 70° South.|The entire Earth.
What does the term Mayday Relay mean?|Delaying the transmission of a distress alert.|A person has fallen overboard.|Careful termination of a distress situation.|Relay transmission of a distress message on behalf of a vessel in distress by a station that is not itself in distress.
One of the important aspects of the EPIRB is the ability to home in on it. On which frequency/band is this carried out?|VHF band.|X-band.|S-band.|406.025 kHz.
A TR will be transmitted with which priority?|Urgency.|Routine.|Distress.|Safety.
On which channel ships will get information of docking when entering a port?|Channel 12.|Channel 13.|Channel 06.|Channel 75.
You received an urgency alert on Channel 70 addressed to all stations:|Acknowledge it immediately by DSC.|Switch to Channel 16 and listen for the voice message.|Wait for the RCC to acknowledge the alert.|Urgency alerts are not transmitted by DSC.
You transmitted a false alert on DSC Channel 70. What should you do?|Inform the RCC so that it will handle the erroneous transmission.|Stop the automatic DSC repetitions, prepare a voice cancellation message and transmit it on Channel 16.|Wait for a response from nearby vessels and notify cancellation to anyone who contacts you.|Wait for a response to be received by NAVTEX.
NAVTEX transmissions are made on:|518 kHz.|4209.5 kHz.|490 kHz.|All of the above.
Identify the NAVTEX message identification code from the following:|NNNN.|ML22.|NVT22.|22MP.
CH87B in phonetic spelling is:|Ch87b.|Champion Helena Eight Seven Bella.|Charlie Hotel Eight Seven Bravo.|Charlie Hotel OctoEight SeteSeven Bravo.
Vessel A calls Vessel B. Which station controls the traffic?|The coast station within the transmitting area of both vessels.|Vessel A.|Vessel B.|It is not important, since there is no distress situation.
What causes the radio beacon to start transmitting?|When manually activated, it will start transmitting immediately.|When automatically activated, once it is released into the sea.|When activated manually or automatically, it will start transmitting in response to a satellite signal.|Answers a and b are correct.
The term Seelonce Feenee means:|Listen without interference on the distress channel.|A specific station silences an interfering station.|The end of the distress situation.|The vessel is unable to assist the vessel in distress.
The SART device operates on which frequency/band?|406.025 kHz, 121.5 kHz.|VHF / 9 kHz.|X-band / 9 GHz.|S-band / 3 GHz.
What is meant by the term Medical Advice?|A sick or injured person requires medical advice from shore.|A communication channel where medical instructions are received automatically.|A sick or injured person requires personal treatment from a doctor located on a nearby vessel.|A sick or injured person requires evacuation by helicopter or fast vessel.
The purpose of Channel 13 is:|Communication between vessels and aircraft during search and rescue.|Communication between two vessels for the purpose of giving way.|Communication relating to AIS.|Any safety communication.
Which statement is correct regarding “on-board communication” in VHF services?|Use 1W on Channels 67 and 79.|Use 1W on Channels 11 and 73.|Use 1W on Channels 75 and 76.|Use 1W on Channels 15 and 17.
What is a shortened call?|RCC Haifa ×2, this is Dugit, over.|RCC Haifa ×2, this is Dugit ×2, over.|RCC Haifa, this is Dugit, over.|RCC Haifa, this is Dugit ×2, over.
The meaning of the term/code “LD00” is:|Station D announces that there is no navigational warning in force.|Station L announces that there is no message in force relating to distress or search and rescue.|Station D announces that it is not operational.|Vessels within the transmission area of Station L will not be able to reject this message.
The position of an EPIRB in the MEO domain will be determined using the:|DSC.|IRIDIUM.|GNSS.|NAVTEX.`,
// 22
`Which item of GMDSS equipment can be operated both automatically and manually?|AIS-SART|GPS EPIRB, 406.03 MHz|NAVTEX receiver integrated with GPS|9 GHz radar transponder
The following transmission is heard on VHF Channel 16: “Marion, SEELONCE MAYDAY.” What does it indicate?|A distress incident is taking place within radio range.|The incident at the distress scene has ended.|The calling station is Marion.|Both A and B are correct.
Which mandatory life-saving communications equipment must be taken aboard a survival craft in a distress situation?|NAVTEX receiver and EPIRB|AIS-SART|Approved maritime radio beacon, SART, and marine VHF radiotelephone|X-band radar transmitter
When operating on VHF Channel 25:|Communication is with a coast station, and the transmit and receive frequencies are different.|Communication is with a coast station, and the transmit and receive frequencies are identical.|Communication takes place on an onboard communications channel.|Duplex communication is conducted with port authorities.
A Medium Earth Orbit Local User Terminal (MEOLUT) receives radio-beacon location data from:|A search and rescue coordinator.|A medium-Earth-orbit navigation satellite constellation (15,000–20,000 km above the Earth).|The Inmarsat communications satellite constellation (approximately 36,000 km above the Earth).|The Cospas-Sarsat satellite constellation (approximately 1,000 km above the Earth).
What should you do if a GPS EPIRB is activated accidentally?|Notify all stations in the vicinity on VHF Channel 16 of the false alert.|Disconnect the beacon battery and notify the manufacturer.|Notify a nearby coast station or Rescue Coordination Centre (RCC) of the false alert on VHF Channel 16.|Notify a nearby Mission Control Centre (MCC) of the false alert on VHF Channel 70.
When the phrase “need towing” is heard over the radio, it is transmitted in the context of:|Communications assigned priority level 2.|Urgency transmissions made by a vessel.|A vessel requesting urgent assistance outside distress procedures.|All of the above.
Which VHF channels have been allocated to protect distress Channel 16 during a distress incident?|Channels 15 and 17|Channels 75 and 76|Channels 73 and 79|Channels 71 and 72
When navigating in GMDSS Sea Area A1:|A vessel is always within range of a NAVTEX station, and DSC is used for the initial distress alert.|A vessel is not necessarily within range of a NAVTEX station, and an EPIRB is used for the initial distress alert.|A vessel is always within range of a station providing port operations communications.|There is no requirement to operate the NAVTEX receiver unless the vessel enters Sea Area A2.
Which expression indicates that distress communications have ended?|SEELONCE MAYDAY|SEELONCE FEENEE|SEELONCE DISTRESS|NO FURTHER ASSISTANCE REQUIRED
Which of the following is a GMDSS functional requirement?|Bridge-to-bridge communications|Transmission of “Tango Romeo”|Reception of T/L|Equipment capable of receiving on 121.5 MHz
Digital Selective Calling (DSC) can be used to address:|All stations or a group of stations.|A specific station.|Both A and B are correct.|Only stations recorded in the equipment directory.
Into how many priority categories are NAVTEX messages classified?|Vital, Important, Routine|Distress, Urgency, Safety|All messages have the same priority unless they concern distress.|According to message categories A, B, D and L.
Which maritime communications equipment operates in the marine VHF frequency band?|EPIRB/GPS EPIRB on 406.025 MHz|9 GHz radar SART|NAVTEX receiver integrated with GPS|Main fixed VHF/DSC radiotelephone, portable VHF, AIS, and AIS-SART
Which simplex VHF channel is used for communication between two vessels?|Channel 12|Channel 13|Channel 15|Channel 75
An AIS-SART is used:|To enable vessels to home in on it during a distress incident.|To receive essential information from nearby vessels to prevent collisions.|To receive maritime safety information messages.|Both A and B are correct.
What is the frequency 4209.5 kHz used for?|Messages associated with Maritime Safety Information (MSI) transmissions.|Safety warnings transmitted by an automatic calling system.|Distress, urgency, safety, and calling communications.|Alerts transmitted by DSC equipment.
The expression “SEELONCE FEENEE” indicates that:|Radio silence is imposed.|An urgency situation has ended.|The distress situation has ended.|A distress situation is ongoing.
Which statement is correct?|The coverage of a NAVTEX station is, in all circumstances, greater than that of a VHF coast station.|NAVTEX coverage approximately doubles at night compared with daytime coverage.|The world is divided into 21 areas known as NAVAREAs.|All of the above are correct.
Marine VHF channels are identified numerically according to which of the following channel ranges?|Channels 01–88|Channels 01–60 and 66–88|Channels 01–30 and 60–88|Channels 01–28 and 60–88`,
// 23
`A vessel operating in Sea Area A1 must be within range of:|At least one vessel continuously monitoring Channel 16|At least one coast station continuously monitoring Channel 16|At least one coast station continuously monitoring Channel 70, 24 hours a day|Two of the above requirements
Which of the following controls may reduce reception range?|Setting the SQUELCH control to minimum|POWER control set to HIGH causing receiver overload|Setting the SQUELCH control to maximum|Positioning the channel selector midway between Channels 6 and 16
A radiotelephone vessel shall monitor Channel 13 at sea:|Whenever possible using Dual Watch|There is no need, continuous watch on a coast station is preferable|24 hours a day|8 hours a day
After abandoning ship and while in the survival craft:|Place the SART high and throw the EPIRB into the water|Place the EPIRB high and throw the SART into the water|Do not activate the EPIRB and SART unless a vessel is nearby|None of the above
Which equipment is used inside or near the life raft?|NAVTEX|Echo sounder|DSC|EPIRB
What is the meaning of the following message on Channel 16?~“All stations x3 this is Rota Radio x3 gale warning channel 27”|ROTA coast station announces that it has a gale warning and will broadcast it on Channel 27|A ship station asks ROTA coast station whether it has a gale warning on Channel 27|ROTA coast station asks all stations for gale warning information|ROTA coast station is ready to receive gale warnings from vessels on Channel 27
The purpose of Channel 16 is:|Distress, urgency, safety, and calling channel for radiotelephone|DSC channel for distress, urgency, and safety alerts|A channel replacing Channel 70 in the GMDSS system|A channel used for NAVTEX and weather broadcasts
How does a station controlling distress traffic indicate the end of distress?|By using the term MAYDAY PRUDONCE|By announcing NO FURTHER ASSISTANCE REQUIRED|By using the term SEELONCE FEENEE|By sending a DSC distress cancellation on Channel 70
The phonetic spelling of “DSC20” is:|DIGITAL SENSOR CALL BISSOTWO NADAZERO|DELTA SENSOR CHARLIE BISSOTWO NADAZERO|DOLPHIN SIERRA CHARLIE BISSOTWO NADAZERO|DELTA SIERRA CHARLIE BISSOTWO NADAZERO
Channel 13 is used for:|Sailing safety communication between ships|Communication with marinas worldwide|Communication with the pilot when entering or leaving port|None of the above
Which equipment is used for sending distress alerts and calls to specific stations?|NAVTEX|GPS|DSC Controller|Scanning watch receiver
Which statement is NOT correct regarding a portable VHF radiotelephone for life raft?|Operates in simplex on 156,525 MHz (Channel 70) and at least one additional channel|Waterproof to a depth of 1 meter for at least 5 minutes|Minimum effective radiated power of 0.25 W|Must operate on Channel 16 and at least one additional channel
Which of the following is a functional requirement of GMDSS?|Bridge-to-Bridge communication|Reception of weather facsimile charts|Both of the above|None of the above
What actions should be taken after transmitting a false VHF distress alert?|Send a DSC cancellation on Channel 70|Prepare a voice cancellation message and transmit it on Channel 16|Transmit a voice cancellation on Channel 13|Transmit a voice cancellation on Channel 24
What does AIS stand for?|AUTO INSERT SIGNAL|AUTOMATIC IDENTIFICATION SYSTEM|AUTOMATIC INFORMATION SYSTEM|No correct answer
How can the range of a SART be maximized?|Place the SART in the water immediately after activation|Position the SART as high as possible|Operate the SART at maximum power|Calibrate the SART frequency using a control light
An EPIRB may be detected by the DSC system provided the beacon transmits on:|121.5 MHz|Channel 70|406–406.1 MHz band|All of the above
Which of the following would be transmitted with second priority?|A vessel lost steering and requires towing|Request for medical advice|Man overboard|Answers 1 and 2 are correct
Safety messages are:|Meteorological warnings|Navigational warnings|Man overboard|Answers 1 and 2 are correct
Which of the following identifies an MMSI of a group of Israeli vessels?|042081111|004280111|042811111|428011111
Select the correct call:|“Haifa Radio x3 this is Andrea x3 I have two R/T calls please channel 6”|“Haifa Radio this is Andrea x2 I have two R/T calls please channel 6”|“Haifa Radio x3 this is Andrea x3 I have two R/T calls please channel 26”|“Haifa Radio x3 this is Andrea x3 I have two R/T calls please channel 16”
What is a shortened call on Channel 16?|A call in a congested traffic area|A call where the called station is named once and the calling station identifies twice|A short distress call during abandonment|Answers 1 and 2 are correct
The term PANPAN means:|Safety message requesting second priority|Urgency message requesting second priority|Distress message requesting first priority|Urgency message. Man overboard
When will NAVTEX reject a message?|The message has already been previously received|The subject indicator matches one programmed for rejection by the operator|The transmitting station identification was programmed for rejection by the operator|All of the above
What justifies the use of the term PANPAN?|Sick/injured person or vessel not under command|Man overboard|Declaration of a firing area|Cancellation of a false alert
Maritime Safety Information is received by means of:|DSC|NAVTEX|SART|COSPAS-SARSAT
To obtain priority for a safety communication in radiotelephony, use the word:|Urgent|Careful|Safety|Securite
Under what conditions will we receive NAVTEX station P?|If selected in programming and/or if it uses message serial code 00|If a daily test routine is performed|If the message identification code is stored in memory|If Individual is selected instead of All Stations
Which installation allows viewing voyage and identification details of vessels?|NAVTEX|EPIRB|SART|AIS
What are the radio communication priorities according to the Radio Regulations?|Vital, important, routine|Distress call, distress message, distress traffic|Activating DSC, activating EPIRB, activating SART|Distress, urgency, safety, routine
Voyage report (TR) details are transmitted:|Before entering and after leaving port|Every 4 hours|Once daily|According to RCC requirements during distress
How many reception cycles per day will be received from 4 selected NAVTEX stations?|24|4|16|21
Which system does COSPAS-SARSAT use in the MEO-SAR layer?|INMARSAT|DSC|IRIDIUM|GNSS
Identify the MID (Maritime Identification Digits) of station 234280482:|428|482|234|342
In communication, to request a response from the other station, say:|Out|Stand-by|Received|Over
What does the term “Received Mayday” mean in distress traffic procedures?|I received your distress alert/call/message and I am immediately proceeding to assist you|I received your distress alert/call/message and I am listening to you|I received your distress alert/call/message and I am about to summon additional help|I received your distress alert/call/message and I have assumed responsibility for the distress traffic
When should the portable VHF radio in the life raft be activated if no acknowledgement to the distress call was received?|Immediately upon boarding the life raft|Upon receiving a signal from the SART or sighting a vessel|Upon boarding the raft beyond standby mode|Upon receiving an EPIRB signal
Which of the following indicates a NAVTEX message identification code received from station N?|NA23|AN23|NNNN|NANA`,
// 24
`What information determines whether a NAVTEX message will be rejected?|The transmitter identification (a number from 1–26 identifying the transmitting station within the NAVAREA).|The subject indicator (a single letter from A–Z indicating the type of message).|The answerback of the receiving station was not programmed into the NAVTEX receiver.|Only messages with serial number 00 will be rejected.
When conducting routine communication using a bridge VHF device at a range of 1 mile, which power setting would you recommend?|25W after dark.|1W day or night.|25W on a bright sunny day.|1W when using DSC at night.
Which statement is NOT correct regarding the COSPAS-SARSAT system?|The EPIRB serves as a satellite beacon and alarm equipment on the life raft.|It locates distress beacons on 121.5 MHz and 406 MHz.|Doppler shift is used for locating the beacons.|It may be used for commercial broadcasts.
Which device provides the primary means in GMDSS for locating ships in distress or their life rafts?|Radio Direction Finder (DF).|Satellite EPIRB.|HF DSC.|VHF homing device.
Which documents are required for international voyages under GMDSS?|Radio station logbook.|IMO deployment plan for shore communication facilities.|Regulations and law publications.|All of the above.
Which of the following maritime identification numbers is associated with AIS signals?|994280001|970254415|428026000|All of the above.`
];

// ---------- build data ----------
const lines = RAW.map(s => s.split("\n").map(x => x.trim()).filter(Boolean));
function resolve(e, q, depth = 0) {
  const s = lines[e][q];
  if (s.startsWith("=")) { const [a, b] = s.slice(1).split(".").map(Number); return resolve(a - 1, b - 1, depth + 1); }
  const parts = s.split("|");
  return { text: parts[0].replace(/~/g, "\n"), opts: parts.slice(1) };
}
const EXAMS = lines.map((ls, e) => ls.map((_, q) => {
  const r = resolve(e, q);
  const ans = KEY_EXTRA[e + 1] ? L.indexOf(KEY_EXTRA[e + 1][q]) : KEY.indexOf(KEY_ROWS[q].split(" ")[e]);
  return { e, q, text: r.text, opts: r.opts, ans };
}));
const PASS = 75;

// ---------- explanations (keyed by exam.question of first appearance) ----------
const EXPL = {
"1.1":"A 406 MHz beacon sends a digital alert to the satellite and a homing signal on 121.5 MHz, and usually has a float-free release. It has no audio homing signal.",
"1.2":"PANPAN is the urgency signal. MAYDAY is distress, SECURITE is safety, and SEELONCE FEENEE ends a distress situation.",
"1.3":"Maritime communication procedures, including distress procedures, are set out in the ITU Radio Regulations.",
"1.4":"Distress is grave and imminent danger to life or to a vessel, and man overboard is such a case. Meteorological and navigational warnings are safety messages.",
"1.5":"The controlling station announces the end of distress with SEELONCE FEENEE, releasing the channel for normal use.",
"1.6":"To connect a call to a shore subscriber (Public Correspondence) you move to a coast station public channel. For Haifa that is channel 24.",
"1.7":"VHF range is line of sight, so it depends on antenna height at both ends: ashore and on the ship.",
"1.8":"A lost EPIRB may set off an alert. Tell the nearest coast station that any alert received is false, and log it.",
"1.9":"A ship's call sign is made of letters (usually 4), like PYCH. The ship's name is not its call sign.",
"1.10":"Each NAVTEX station transmits 6 times a day, every 4 hours, in a slot of up to 10 minutes.",
"1.11":"AIS stands for Automatic Identification System.",
"1.12":"After a false alert, cancel it with a voice message to all stations on channel 16 so nobody acts on it.",
"1.13":"Urgency priority (PANPAN) is for messages about the safety of a mobile unit or a person, when there is no immediate danger to life yet.",
"1.14":"The safety signal (SECURITE) is used for navigational and meteorological warnings.",
"1.15":"GMDSS equipment is tested daily. On DSC this is an internal test without transmitting.",
"1.16":"The DSC controller sends distress alerts and selective calls to a specific station by MMSI.",
"1.17":"The radio log is kept at the station's operating position, next to the radio, so events are logged in real time.",
"1.18":"Bridge to Bridge (channel 13) is communication between ships' bridges to coordinate navigation and safety.",
"1.19":"In search and rescue, communication is on channel 16 and channel 06, the SAR channel that is also used with aircraft.",
"1.20":"A TR (voyage details) is sent to the coast station on entering and leaving port, so they know where the vessel is and where it is heading.",
"2.1":"Line of sight means range is limited to the horizon. So antenna height matters, and the typical range is about 25 miles.",
"2.2":"SECURITE three times announces a safety message: a navigational or meteorological warning.",
"2.3":"Channel 16 is the voice distress and calling channel, so every survival craft VHF must include it.",
"2.4":"A ship MMSI starts directly with the MID. Here 428 is Israel's MID, so both A and B are correct.",
"2.5":"A VHF set has a low-power setting of 1 Watt, versus 25 Watt at full power.",
"2.6":"A DSC distress alert includes the MMSI, nature of distress, position and the time of the last position update.",
"2.7":"The satellite relays the signal to a LUT ground station, which calculates the position. The MCC only passes the information on.",
"2.8":"Traffic List: the coast station has traffic for several vessels and will read out the list of names on channel 25.",
"2.9":"Bridge to Bridge communication is one of the GMDSS functional requirements. Weather fax reception is not.",
"2.10":"AIS broadcasts identity, position, speed and heading, helping to prevent collisions and improve navigational safety.",
"2.11":"Per the booklet's answer key: switch off the set to stop repeated transmissions, and cancel with a voice message on channel 16.",
"2.12":"An international voyage needs all of them: the List of Coast Stations, the List of Ships, and the List of Call Signs and Numerical Identities.",
"2.13":"A request to evacuate an injured person is an urgency message (PANPAN). There is danger to a person, but not immediate danger to life.",
"2.14":"The safety signal is SECURITE, said three times.",
"2.15":"In a NAVTEX code the first letter is the station (M), the second is the message type (A, navigational warning), and the digits are the message number (33).",
"2.16":"Channels 15 and 17 are for on-board communication and are limited to 1 Watt.",
"2.17":"On-board communication is on channels 15 and 17.",
"2.18":"PANPAN is an urgency message, second priority after distress.",
"2.19":"If no details are entered, DSC transmits the alert with default data: undesignated distress and the last position in memory.",
"2.20":"The beep shows that a radar nearby is triggering the SART, meaning a ship or aircraft is probably close.",
"3.1":"The SART is X-Band and works by line of sight, so the higher it is, the longer the range.",
"3.3":"On channels 15 and 17 (on-board communication) transmission is limited to 1 Watt.",
"3.4":"Per the booklet's answer key, the claim of a 2 Watt maximum power is incorrect. The standard specifies a minimum of 0.25 Watt.",
"3.5":"AIS stands for Automatic Identification System.",
"3.6":"When an EPIRB is activated by mistake, tell a coast station or RCC immediately so they do not launch a search.",
"3.8":"VHF on-scene communication is on channel 16.",
"3.10":"SEELONCE FEENEE means the distress situation has ended.",
"3.11":"Bridge-to-bridge communication is a GMDSS functional requirement. Weather fax is not.",
"3.13":"NAVTEX messages are divided into three levels: Vital, Important and Routine.",
"3.14":"Safety priority is for navigational and weather warnings. Man overboard is distress, and a serious medical condition is urgency.",
"3.16":"In Area A1 the vessel must be able to initiate a ship-to-shore distress alert from the position from which it is navigated.",
"3.17":"Channel 16 is used for distress, urgency and safety communication, and for routine calling before moving to a working channel.",
"3.18":"All the examples are urgency: towing a restricted vessel, a medical condition and a medical evacuation.",
"3.19":"On Scene is communication at the incident scene, between a unit in distress and the units coming to help.",
"3.20":"A lifeboat's call sign is the mother ship's call sign followed by two digits.",
"4.1":"On leaving port, send a TR (voyage details) to the nearest coast station.",
"4.2":"A safety message about a firing range needs no transmitted reply. Log it and pass it to the watchkeeper.",
"4.3":"SAR units communicate with the station in distress on channel 16 and channel 06.",
"4.5":"Per the booklet's answer key, fishing vessels communicate with the Tel Aviv-Jaffa station on channels 67 and 73.",
"4.6":"A COSPAS-SARSAT beacon transmits on 406.025 MHz, has a 121.5 MHz homing signal, and usually a float-free release as well.",
"4.7":"The DSC controller's internal test, without transmitting, is done once a day.",
"4.8":"The SART operates in X-Band (9 GHz), not S-Band, so this claim is incorrect.",
"4.9":"The SART transmits only when it is interrogated by an X-Band radar within range. Until then it is on standby.",
"4.10":"A DSC urgency alert announces a message that will follow. Switch to channel 16 and listen for it.",
"4.11":"A group MMSI starts with 0 followed by the MID. 048211111 belongs to MID 482, which is not Israeli (Israel is 428).",
"4.12":"Channel 13 is the inter-ship navigational safety channel (Bridge to Bridge).",
"4.13":"A leading 0 marks a group, and the next three digits are the MID. So 023111428 is a group with MID 231.",
"4.14":"At sea, channel 16 is monitored 24 hours a day.",
"4.15":"NAVTEX broadcasts meteorological warnings, including hurricane warnings. The receiver only receives and does not transmit.",
"4.16":"Channel 15 (together with channel 17) is an on-board communication channel.",
"4.17":"Program the NAVTEX receiver for the stations and message types you want, and other messages will not be printed.",
"4.19":"Mayday Relay is the transmission of a distress message by a station not in distress, on behalf of the vessel in distress.",
"4.20":"TR is a voyage report. Clement tells Haifa it wants to transmit its voyage details.",
"5.3":"On-board communication is on channels 15 and 17.",
"5.4":"COSPAS-SARSAT satellites measure the beacon's Doppler shift and pass it to the LUT, which calculates the position from it.",
"5.7":"Your turn is 4 means you are fourth in line. Keep listening on both channel 16 and channel 26 (Dual Watch) until the station calls you.",
"5.8":"A lost EPIRB may set off an alert. Tell the nearest coast station that it is false, and log it.",
"5.9":"A vessel is identified on the radio by its international call sign, its MMSI and the vessel's name.",
"6.1":"Inmarsat-E transmits to Inmarsat satellites in L-Band (about 1.6 GHz).",
"6.2":"Between a tug and its tow, use on-board channels 15 and 17 at low power.",
"6.3":"After a 406 MHz false alert, contact a nearby coast station and cancel by voice, so they pass it to the RCC.",
"6.4":"Dual Watch lets you monitor both channel 16 and another channel, such as a public channel.",
"6.5":"Out ends a conversation when no reply is expected. Over means a reply is expected.",
"6.6":"A DSC alert includes the MMSI, nature of distress, last position and time.",
"6.7":"NAVTEX also operates on 4209.5 kHz (HF NAVTEX), and it is part of the global MSI service.",
"6.8":"A leading 0 marks a group of vessels. 043805050 is a group with MID 438.",
"6.9":"Per the booklet's answer key the answer is A. In practice the Squelch mutes background noise when there is no signal.",
"6.10":"PRUDONCE means limited, careful working may resume on channel 16, even though the distress has not ended.",
"6.12":"NAVTEX range on 518 kHz is about 200 to 400 nautical miles.",
"6.13":"Distress acknowledgement: MAYDAY, the distressed station's name ×3, This is and your name ×3, Received Mayday, then Over.",
"6.14":"Between two vessels, the called station (SAMSON) controls and sets an inter-ship working channel, such as channel 08.",
"6.16":"MAYDAY is transmitted when there is grave and imminent danger to life and immediate help is needed.",
"6.17":"X-Band (9 GHz) is the radar band, and the radar transponder (SART) operates in it so it can be homed on.",
"6.18":"When spelling numbers, use the ITU digit words: 2 is Bissotwo. RQ 2 RT CALLS is spelled letter by letter.",
"6.19":"If you delete the message identifier from memory, the receiver will pick the message up again in the next broadcast, in 4 hours.",
"6.20":"A coast station MMSI starts with 00 (004560003). A name with Radio, like EilatRadio, also identifies a coast station.",
"7.1":"A distress alert is cancelled when it was a false alert. NAVTEX is receive-only and does not transmit alerts.",
"7.2":"Inmarsat does not cover Area A4 (the polar regions). There you rely on HF, so this claim is incorrect.",
"7.3":"Per the booklet's answer key, the word CONTROL belongs to on-board communication, where the main station is called Control.",
"7.4":"518 kHz is an MF frequency that propagates as a ground wave, so it can be received hundreds of miles away.",
"7.5":"00366 is a coast station, G2B is VHF DSC, and both stations have MID 366. All the statements are correct.",
"7.6":"The phonetic alphabet starts with Alfa, Bravo, Charlie.",
"7.7":"At sea, channel 16 is monitored 24 hours a day.",
"7.8":"The SART is placed high to increase its range, and the EPIRB floats in the water tethered to the raft.",
"7.9":"A VHF-DSC EPIRB transmits on channel 70, so DSC sets can receive it.",
"7.10":"Space wave (straight line) propagation is typical of VHF and above: 121.5 MHz and channel 12. 518 kHz is a ground wave.",
"7.11":"Priority order in the Radio Regulations: distress, urgency, safety, ship's business and routine.",
"7.12":"Tel-Aviv here is the vessel's name. The TR reports that it left Haifa bound for Ashdod.",
"7.13":"Channel 13 is the inter-ship navigational safety channel (Bridge to Bridge).",
"7.14":"Safety messages are meteorological and navigational warnings. A vessel not under command is urgency.",
"7.15":"In a ship MMSI, the first three digits are the MID: 234.",
"7.17":"Over means I have finished speaking and expect a reply.",
"7.18":"In an abbreviated call you call the station once and identify yourself twice.",
"7.19":"Per the booklet's answer key, DSC communication gets the highest priority.",
"7.20":"CER is the percentage of wrong characters. At 6% the message is not stored in memory, so it will be received again in the next broadcast. All the statements are correct.",
"8.1":"A vessel not under command and not in immediate danger asks for a tow with urgency priority: PANPAN to All Stations.",
"8.2":"The number 00 in a NAVTEX code means a mandatory message. It prints on every receiver, even one not programmed to receive it.",
"8.3":"NAVTEX range on 518 kHz is about 200 to 400 nautical miles.",
"8.4":"After an Inmarsat-E false alert, cancel by voice to a nearby coast station, which passes it to the RCC.",
"8.5":"The working channels of foreign coast stations are in the List of Coast Stations, or the coast station assigns the channel.",
"8.6":"Channel 06 is used for search and rescue (including aircraft), and channel 16 is the distress channel.",
"8.7":"The DSC is tested once a day, and the test is recorded in the station log.",
"8.8":"A battery can show normal voltage with no load and then collapse when transmitting. That's why it is tested under load.",
"8.9":"The LUT ground station calculates the 406 MHz beacon's position from the satellite data.",
"8.10":"Per the booklet's answer key, a long message to another ship goes on inter-ship channel 06.",
"8.11":"The SART appears on radar as 12 dots. As you get closer they turn into arcs, and finally into circles around its position.",
"8.12":"T.L is Traffic List, a list of traffic a coast station broadcasts to ships.",
"8.13":"Channels 06 and 16 are Simplex. Channels 24 to 27 are public Duplex channels.",
"8.14":"In a ship MMSI, the first three digits are the MID: 231.",
"8.15":"The radiotelephone urgency signal is PANPAN.",
"8.16":"The COSPAS-SARSAT low-orbit (LEO) system calculates position using the Doppler effect.",
"8.18":"On Board Communication is internal communication between VHF sets on the same vessel.",
"8.19":"The DSC controller sends distress alerts and calls to specific stations.",
"8.20":"A lighthouse that is out of service endangers navigational safety, so a SAFETY message is broadcast.",
"9.1":"Man overboard is distress. Meteorological and navigational warnings are safety, and an injured person is usually urgency.",
"9.3":"NAVTEX range on 518 kHz is about 200 to 400 nautical miles.",
"9.4":"After a DSC false alert, cancel with a voice message to all stations on channel 16.",
"9.5":"A survival craft portable VHF must work on channel 16, not on channel 70 (DSC). So this claim is incorrect.",
"9.8":"A safety call (SECURITE) is for navigational and meteorological warnings.",
"9.10":"Per the booklet's answer key, a long message to another ship goes on inter-ship channel 06.",
"9.11":"The SART appears on radar as dots. As you get closer they turn into arcs, and finally into circles around its position.",
"9.12":"T.L is Traffic List, a list of traffic from a coast station to ships.",
"9.15":"SEELONCE MAYDAY is transmitted only by the station controlling the distress, that is the coast station or the ship in distress, to silence Dalia.",
"9.16":"The COSPAS-SARSAT system locates the beacon using the Doppler effect.",
"9.18":"On Board Communication is internal communication between VHF sets on the same vessel.",
"9.20":"DSC stands for Digital Selective Calling.",
"10.1":"A distress alert is cancelled when it was a false alert sent from the DSC. NAVTEX does not transmit alerts.",
"10.2":"Urgency traffic opens with PANPAN ×3 followed by ALL STATIONS.",
"10.3":"A NAVTEX receiver on 518 kHz is the main equipment for receiving MSI (maritime safety information).",
"10.4":"If a routine DSC call goes unanswered, wait 5 minutes before calling again.",
"10.5":"PC21 is a NAVTEX message code: station P, message type C and number 21.",
"10.6":"Stations with the same identification letter must be far enough apart not to interfere with each other, at least 800 miles per the key.",
"10.7":"At sea, channel 16 is monitored 24 hours a day.",
"10.8":"NAVTEX reaches further than VHF, so a NAVTEX distress relay widens the search circle.",
"10.9":"PUB30 phonetically: Papa, Uniform, Bravo, Terrathree, Nadazero.",
"10.10":"Channel 12 is the first port operations channel in Simplex.",
"10.11":"Batteries are tested under load, with all equipment on and the VHF transmitting, and then the terminal voltage is measured.",
"10.12":"All these messages are sent with distress priority, including the announcement of the end of distress.",
"10.13":"Channel 13 is a safety channel between ships, not between a coast station and a vessel, so no answer is correct.",
"10.14":"A storm warning and a lighthouse out of service are safety messages. An engine failure at sea is urgency.",
"10.15":"A group MMSI has 9 digits, starting with 0 followed by the MID. 036611111 fits.",
"10.17":"Channel 25 is a coast station public channel, so the communication is between a ship and a coast station.",
"10.19":"PANPAN is urgency, second priority. It is also used for illness or injury of a crew member.",
"10.20":"The SART works at 9 GHz (microwaves), which propagate as a space wave in a straight line.",
"11.1":"An MMSI starting with 00 (004280001) and a name with Radio (RejekaRadio) identify a coast station. 'Haifa' on its own is not enough.",
"11.2":"SECURITE is safety: a storm or a mine. A vessel needing a tow is urgency.",
"11.3":"Channel 06 is used to communicate with aircraft in search and rescue.",
"11.4":"NAVTEX provides MSI: navigational warnings, meteorological warnings and search and rescue information.",
"11.5":"A Vital-level NAVTEX message reaches beyond the VHF range of Area A1.",
"11.6":"When the SART is activated and there is no X-Band radar nearby, it stays in standby, receive-only mode.",
"11.7":"AIS provides identification and movement data that help prevent collisions.",
"11.8":"The distress call: MAYDAY ×3, This is, and the vessel's name ×3.",
"11.9":"Any of these situations justifies a Mayday Relay.",
"11.10":"Per the booklet's answer key, the called station, that is you, sets the working channel.",
"11.11":"A LUT is a COSPAS-SARSAT ground station that locates and identifies the beacon.",
"11.12":"A woman in labour who needs assistance is urgency. A storm is safety, and pirates are distress.",
"11.13":"Bridge to Bridge is on channel 13.",
"11.14":"Per the booklet's answer key, the Ashdod port authorities are contacted on channel 14.",
"11.15":"A Navigation Warning is safety traffic, and Haifa will broadcast it on channel 25.",
"11.16":"156.8 MHz (channel 16), 121.5 MHz and channel 06 are used in search and rescue, including with aircraft.",
"11.18":"518 kHz is the international NAVTEX frequency in English, and part of the MSI service.",
"11.19":"The DSC operates Simplex on channel 70, decodes digital transmissions (G2B), and transmits at up to 25 Watt.",
"11.20":"The RCC can send a Relay to all stations, to a group or a specific ship, and to a defined geographic area.",
"12.1":"Per the booklet's answer key, the survival craft portable VHF is tested for transmit and receive once a week.",
"12.2":"Channel 70 is for DSC only: distress, urgency, safety and calling alerts. There is no voice on it.",
"12.3":"In an abbreviated call you call the station once and identify yourself twice.",
"12.4":"Area A1 is the area within VHF coverage of at least one coast station with DSC.",
"12.5":"The NAVTEX priority order is Vital, Important, then Routine.",
"12.6":"The station in distress silences interfering stations with SEELONCE MAYDAY.",
"12.7":"An urgency situation announced to all stations is cancelled with a voice message on channel 16.",
"12.8":"A SART battery lasts 96 hours on standby.",
"12.9":"Most NAVTEX stations have a range of 200 to 400 nautical miles.",
"12.10":"Channels 06 and 08 are Intership channels, for ship-to-ship communication.",
"12.11":"Dual Watch is alternate listening to channel 16 and a selected working channel.",
"12.12":"UN2MO: Uniform, November, Bissotwo, Mike, Oscar.",
"12.13":"A group MMSI starts with 0 followed by the MID: 024700222.",
"12.14":"Channel 15 is limited to 1 Watt.",
"12.15":"A notice of an approaching storm is a safety message. Man overboard is distress, and a request for medical help is urgency.",
"12.16":"Per the booklet's answer key, the coast station acknowledges the distress alert by voice on channel 16.",
"12.17":"Mayday Relay is the transmission of a distress message by a station not in distress.",
"12.18":"PRUDONCE allows careful working on the distress channel, even though the distress has not ended.",
"12.19":"In communication between a ship and a coast station, the coast station controls the communication.",
"12.20":"The aim of GMDSS is to automate and improve emergency communications in world shipping.",
"13.1":"A radar transponder (SART) operates in X-Band.",
"13.2":"Between a tug and its tow, use on-board channels 15 and 17.",
"13.9":"A VHF-DSC EPIRB transmits on channel 70.",
"13.12":"NAVTEX range is 200 to 400 nautical miles.",
"13.13":"Distress acknowledgement: MAYDAY, the name ×3, This is and your name ×3, Received Mayday, then Over.",
"13.16":"MAYDAY is transmitted when there is immediate danger to the life of one or more persons.",
"13.17":"A NAVTEX receiver rejects a message it has already received, with the same serial number and type from the same station.",
"13.19":"Delete the message identifier from memory, and the message will be received again in the next broadcast, in 4 hours.",
"14.1":"GPS provides the accurate position that is fed into the DSC and the beacons.",
"14.3":"490 kHz is the national-language NAVTEX frequency. 518 kHz is English.",
"14.4":"Per the booklet's answer key, voyage details (TR) are sent to improve the routing of traffic from the coast station to the vessel.",
"14.6":"A name with Radio (DakarRadio) and an MMSI starting with 00 (005673333) identify a coast station.",
"14.7":"Equipment operability is proven by a daily test or by routine operation.",
"14.9":"DSC20 phonetically: Delta, Sierra, Charlie, Bissotwo, Nadazero.",
"14.10":"Channel 13 is the ship-to-ship navigational safety channel.",
"14.12":"A portable VHF must work on channel 16, not on channel 70 (DSC). So this claim is incorrect.",
"14.18":"The EPIRB is attached to the survival craft and left floating beside it.",
"14.19":"ROTA announces on channel 16 that it has a gale warning, and will broadcast the details on channel 27.",
"14.20":"Channel 16 is the radiotelephone distress, urgency, safety and calling channel.",
"15.1":"Between two vessels, the called station (Damien) controls the traffic.",
"15.2":"Bridge to Bridge is an inter-ship channel for navigational safety (channel 13).",
"15.3":"Safety communication is a transmission announcing an important navigational or weather warning.",
"15.4":"In NAVTEX, reception of message types A, B, D and L cannot be disabled.",
"15.5":"A Transit Report (TR) is a routine message, with ROUTINE priority.",
"15.6":"SBM stands for Shore Based Maintenance.",
"15.7":"'Haifa' on its own is not a coast station identification. You need HaifaRadio.",
"15.8":"The medical codes appear in the International Code of Signals.",
"15.9":"A GPIRB relies on GPS, not Doppler. Geostationary satellites cannot measure Doppler.",
"15.10":"You can home on 121.5 MHz (the EPIRB homing signal) and on 9 GHz (the SART).",
"15.11":"Non-distress transmissions on channel 16 are kept to a minimum, no more than one minute.",
"15.12":"The coast station public correspondence channels are 24 to 28.",
"15.13":"In A1, send a distress alert by DSC on channel 70, and by a satellite beacon (GPIRB).",
"15.14":"A portable VHF serves all these uses: contact with the mother ship, with rescue units, and on-board communication.",
"15.15":"AIS data is divided into static, dynamic and voyage data.",
"15.16":"A distress relay can arrive by voice on channel 16, by DSC and by NAVTEX.",
"15.17":"Channel 06 is used to communicate with aircraft in search and rescue, and also between ships.",
"15.18":"A DSC alert includes the MMSI, nature of distress, time and position, and priority. It does not include the vessel's name.",
"15.19":"After a DSC safety announcement, switch to channel 16 to hear the message itself.",
"15.20":"MCC is the COSPAS-SARSAT Mission Control Centre.",
"16.1":"An MMSI starting with 00 (002130001) and a name with Radio (RomaRadio) identify a coast station.",
"16.2":"PRUDONCE allows careful working during a distress. None of the answers describes that.",
"16.3":"Channel 06 is used to contact a search aircraft.",
"16.4":"NAVTEX provides MSI in three priority levels: navigational warnings, weather and SAR.",
"16.5":"You can home on the SART by radar and on the EPIRB by its 121.5 MHz signal.",
"16.7":"A DSC alert repeats automatically every 3.5 to 4.5 minutes until it is acknowledged.",
"16.11":"A false alert cancellation needs no reply. Log it and carry on as normal.",
"16.14":"The SART has a battery that lasts 96 hours on standby.",
"16.15":"There is no immediate danger, so it is urgency: request a tow with PANPAN on channel 16.",
"16.16":"Per the booklet's answer key, AIS works together with DSC, for example for channel management via channel 70.",
"16.17":"SEELONCE MAYDAY is transmitted only by the station controlling the distress: the coast station or the ship in distress.",
"16.18":"518 kHz is the international NAVTEX frequency in English.",
"16.19":"The SART operates in X-Band.",
"16.20":"The RCC can send a Relay to all stations, to a group or a specific ship, and to a defined area.",
"17.1":"A false alert sent from the DSC is cancelled. The SART does not transmit distress alerts.",
"17.2":"Urgency traffic opens with PANPAN followed by ALL STATIONS.",
"17.3":"A NAVTEX receiver on 518 kHz is the equipment for receiving MSI.",
"17.5":"PC21 is a NAVTEX message code: station P, type C and number 21.",
"17.6":"NAVTEX stations with the same letter need a large distance between them to avoid interference, at least 800 miles per the key.",
"17.7":"The DSC watch on channel 70 at sea is kept 24 hours a day.",
"17.10":"Channel 12 is the port operations channel in Simplex.",
"17.11":"Batteries are tested under load, with all equipment on and the VHF transmitting, and then the terminal voltage is measured.",
"17.13":"Channel 13 is a safety channel between ships. No answer describes it correctly.",
"17.18":"In an abbreviated call you call the station once and identify yourself twice.",
"17.19":"PANPAN is an urgency message, second priority.",
"17.20":"The SART works in microwaves (9 GHz), which propagate as a space wave.",
"18.1":"Vessel names by MMSI are listed in the List of Call Signs and Numerical Identities.",
"18.3":"A hydrometer measures the specific gravity of the battery electrolyte, which shows its state of charge.",
"18.4":"SEELONCE MAYDAY to All Stations means the controlling station is silencing interfering stations.",
"18.5":"Doppler position accuracy is about 5 km. With integrated GPS it is much better.",
"18.6":"To give way and coordinate manoeuvres, use channel 13.",
"18.7":"VHF range depends on antenna height, both ashore and on the ship.",
"18.8":"A COSPAS-SARSAT beacon is received by LEOSAR or GEOSAR satellites.",
"18.9":"A coast station is called by the place name followed by Radio: Napoli Radio.",
"18.12":"After a DSC false alert, cancel with a voice message to all stations on channel 16.",
"18.16":"The DSC controller sends distress alerts and calls to specific stations.",
"18.17":"Per the booklet's answer key, two yachts can talk on channels 13, 15 and 11.",
"18.19":"An identification starting with 970 belongs to an AIS-SART.",
"18.20":"A TR is sent on entering and leaving port.",
"19.1":"518 kHz is a medium frequency, and MF signals travel along the earth's surface as ground waves. That is why NAVTEX on 518 kHz reaches about 200–400 NM.",
"19.2":"You do not acknowledge a safety message. Check whether it affects your position, act on it, and record it in the radio log.",
"19.3":"AIS exchanges identity, position, course and speed between vessels to improve navigational safety and prevent collisions, especially in busy waters.",
"19.4":"Port operations channels such as 12 and 14 carry information and docking instructions for vessels entering port.",
"19.5":"Each character is spelled phonetically in order: 1 = UNAONE, 0 = NADAZERO, P = PAPA, M = MIKE.",
"19.6":"A SART in standby mode starts transmitting when it is interrogated by an X-band (9 GHz) radar within range.",
"19.7":"Each NAVTEX station transmits every 4 hours, so after 20:40 the next transmission is at 00:40 the following day.",
"19.8":"Identities starting with 970 belong to AIS-SARTs.",
"19.9":"In a shortened call you name the called station once and identify yourself twice.",
"19.10":"490 kHz is used for NAVTEX broadcasts in the national language, Greek in this case. 518 kHz is always in English.",
"19.11":"A SART must work in standby for at least 96 hours, which is 4 days.",
"19.12":"Do not acknowledge an urgency DSC alert. Listen for the voice message on the follow-up channel, log it, and inform the master.",
"19.13":"OUT ends the exchange. OVER asks the other station to reply, so “Over and Out” is never used.",
"19.14":"A NAVTEX ID has four characters: transmitting station (I), subject (B), and a two-digit serial number (03).",
"19.15":"Channel 08 is an intership channel for routine ship-to-ship traffic. Channels 75 and 76 guard Channel 16, and 15 is for on-board communication.",
"19.16":"MEOSAR uses GNSS satellites (GPS, Galileo, GLONASS). Inmarsat is a geostationary system and is not part of MEOSAR.",
"19.17":"A TR tells the coast station where the vessel is, so it can contact the vessel, for example to deliver traffic.",
"19.18":"An AIS-SART transmits its position, which appears on the AIS receivers of nearby vessels on VHF.",
"19.19":"AIS works on VHF channels 87B and 88B (161.975 and 162.025 MHz).",
"19.20":"The urgency signal PAN PAN is only for urgent situations. Using it to ask for a NAVTEX message is not legitimate.",
"20.1":"On-board communications use the word “Control” for the station on the bridge that controls the traffic.",
"20.2":"A TR (voyage report) is transmitted when entering or leaving port.",
"20.3":"AIS works on VHF channels 87B and 88B.",
"20.4":"The higher the SART, the further away a radar can detect it, so position it as high as possible.",
"20.5":"Per the answer key, the COSPAS-SARSAT satellites are the key part of GMDSS search and rescue, because they detect and locate distress beacons worldwide.",
"20.6":"Channels 06 and 16 are simplex working channels: the same frequency is used to transmit and receive.",
"20.7":"Channel 70 is for DSC only. It carries digital distress, urgency and safety alerts, not voice.",
"20.8":"Bridge-to-bridge (Channel 13) is communication between ships about safe navigation.",
"20.9":"A DSC unit both transmits and receives distress alerts. An EPIRB and an AIS-SART only transmit.",
"20.10":"A 406 MHz beacon has a 121.5 MHz homing transmitter but no audible homing signal.",
"20.11":"After a false DSC alert, switch the DSC off to stop the repetitions and cancel it by voice on Channel 16.",
"20.12":"SECURITE announces a safety message, such as a navigational or meteorological warning.",
"20.13":"A VHF transmitter has a low-power setting of 1 W. High power is 25 W.",
"20.14":"A group MMSI starts with a single 0. One starting with 00 is a coast station.",
"20.15":"NAVTEX messages are prioritised as Vital, Important and Routine.",
"20.16":"DSC stands for Digital Selective Calling.",
"20.17":"AIS beacon identities start with 97: 970 is an AIS-SART, 972 an MOB device and 974 an EPIRB-AIS.",
"20.18":"Survival craft VHF must work on Channel 16 voice (E3F/G3E).",
"20.19":"A request for medical assistance is an urgency situation (PAN PAN MEDICO).",
"20.20":"Turning the squelch up to maximum cuts out weak signals and so reduces reception range.",
"21.1":"Geostationary satellites sit above the equator and cover roughly 70°N to 70°S. They cannot see the polar regions.",
"21.2":"MAYDAY RELAY is used by a station that is not itself in distress to relay a distress message for another vessel.",
"21.3":"Rescuers home in on an EPIRB using its 121.5 MHz signal, which is in the VHF band.",
"21.4":"A TR is sent with routine priority.",
"21.5":"Per the answer key, port information and docking instructions are given on Channel 12.",
"21.6":"Do not acknowledge an urgency DSC alert to all stations. Switch to Channel 16 and listen for the PAN PAN voice message.",
"21.7":"Stop the automatic DSC repetitions, then transmit a voice cancellation to all stations on Channel 16.",
"21.8":"NAVTEX is broadcast on 518 kHz (English), 490 kHz (national language) and 4209.5 kHz (HF).",
"21.9":"A NAVTEX ID is a station letter, a subject letter and a two-digit serial number, for example ML22.",
"21.10":"Per the answer key, numbers are spoken with the phonetic number words, so 8 = OCTOEIGHT and 7 = SETTESEVEN.",
"21.11":"In communication between two vessels, the called station (Vessel B) controls the traffic.",
"21.12":"An EPIRB starts transmitting when switched on manually, or automatically when it floats free in the sea.",
"21.13":"SEELONCE FEENEE means the distress situation has ended and normal traffic can resume.",
"21.14":"A radar SART works in the X-band (9 GHz).",
"21.15":"Medical Advice (MEDICO) is when a sick or injured person needs medical advice from shore.",
"21.16":"Channel 13 is the bridge-to-bridge channel for navigation safety, such as agreeing how vessels will pass each other.",
"21.17":"On-board communication uses 1 W on Channels 15 and 17.",
"21.18":"In a shortened call you name the called station once and identify yourself twice.",
"21.19":"LD00: station L, subject D (distress/SAR). Messages with serial number 00 cannot be rejected by the receiver.",
"21.20":"In MEOSAR, EPIRB positions are determined using GNSS satellites.",
"22.1":"A float-free GPS EPIRB can be switched on by hand or activates automatically when it is released into the sea.",
"22.2":"SEELONCE MAYDAY imposes radio silence because a distress incident is taking place within radio range.",
"22.3":"In distress, take the approved beacon (EPIRB), the SART and the portable VHF radiotelephone into the survival craft.",
"22.4":"Channel 25 is a duplex public correspondence channel with a coast station, so the transmit and receive frequencies are different.",
"22.5":"A MEOLUT receives beacon data from satellites in GNSS navigation constellations in medium Earth orbit.",
"22.6":"If an EPIRB is activated by mistake, tell the nearest coast station or RCC on Channel 16 that it is a false alert.",
"22.7":"Per the answer key, a request for towing can come under all of these descriptions.",
"22.8":"Channels 75 and 76 are guard channels on either side of Channel 16. Only low power is allowed on them, to protect Channel 16.",
"22.9":"Per the answer key, in Sea Area A1 a vessel is within range of a NAVTEX station and uses VHF DSC for the initial distress alert.",
"22.10":"SEELONCE FEENEE announces that distress communications have ended.",
"22.11":"Bridge-to-bridge communication is one of the nine GMDSS functional requirements.",
"22.12":"DSC can address all stations, a group of stations, or a specific station.",
"22.13":"NAVTEX messages are prioritised as Vital, Important and Routine.",
"22.14":"The fixed VHF/DSC radio, portable VHF, AIS and AIS-SART all operate in the marine VHF band.",
"22.15":"Channel 13 is the simplex intership channel for bridge-to-bridge communication between two vessels.",
"22.16":"An AIS-SART transmits its position over AIS so that vessels can home in on it.",
"22.17":"4209.5 kHz is the HF NAVTEX frequency, used for Maritime Safety Information.",
"22.18":"SEELONCE FEENEE indicates that the distress situation has ended.",
"22.19":"Per the answer key, all three statements are correct.",
"22.20":"Marine VHF channels are numbered 01–28 and 60–88.",
"23.1":"Sea Area A1 is the area within range of at least one VHF coast station keeping a continuous DSC watch on Channel 70, 24 hours a day.",
"23.2":"Turning the squelch up to maximum cuts out weak signals and so reduces reception range.",
"23.3":"Channel 13 should be monitored whenever possible, for example by using Dual Watch.",
"23.4":"Put the SART as high as possible for radar range, and put the EPIRB in the water so it can transmit freely.",
"23.5":"The EPIRB is taken into the life raft and used in or near it.",
"23.6":"Rota Radio is announcing to all stations that it has a gale warning and will broadcast it on Channel 27.",
"23.7":"Channel 16 is the VHF voice channel for distress, urgency, safety and calling.",
"23.8":"The controlling station ends the distress with SEELONCE FEENEE.",
"23.9":"Each character is spelled phonetically: DELTA SIERRA CHARLIE BISSOTWO NADAZERO.",
"23.10":"Channel 13 is the bridge-to-bridge channel for navigation safety between ships.",
"23.11":"The DSC controller sends distress alerts and calls to specific stations.",
"23.12":"Survival craft VHF must work on Channel 16, not on DSC Channel 70, so statement A is not correct.",
"23.13":"Bridge-to-bridge communication is one of the GMDSS functional requirements. Weather fax is not.",
"23.14":"After a false VHF distress alert, cancel it with a voice message on Channel 16.",
"23.15":"AIS stands for Automatic Identification System.",
"23.16":"The higher the SART, the further away a radar can detect it.",
"23.17":"The DSC system can receive an EPIRB that transmits a VHF DSC alert on Channel 70.",
"23.18":"Towing and medical advice are urgency cases, which have second priority.",
"23.19":"Safety messages include meteorological and navigational warnings.",
"23.20":"A group MMSI is 0 followed by the MID (428 for Israel), so 042811111.",
"23.21":"Call the coast station three times, identify yourself three times, and propose a public correspondence working channel such as 26.",
"23.22":"In a shortened call you name the called station once and identify yourself twice.",
"23.23":"PANPAN is the urgency signal, which requests second priority.",
"23.24":"Per the answer key, all three can cause NAVTEX to reject a message.",
"23.25":"PANPAN is justified by urgency situations such as a sick or injured person or a vessel not under command.",
"23.26":"Maritime Safety Information is received by NAVTEX.",
"23.27":"A safety communication is announced with the word SECURITE.",
"23.28":"Station P is received if it is selected in the programming. Messages with serial number 00 are always received.",
"23.29":"AIS shows other vessels' identification and voyage details.",
"23.30":"The Radio Regulations priorities are: distress, urgency, safety, routine.",
"23.31":"A TR is transmitted before entering and after leaving port.",
"23.32":"Each NAVTEX station transmits 6 times a day (every 4 hours), so 4 stations give 24 reception cycles.",
"23.33":"The COSPAS-SARSAT MEO layer uses GNSS satellites.",
"23.34":"The MID is the first three digits of the MMSI: 234 (United Kingdom).",
"23.35":"OVER asks the other station to reply.",
"23.36":"Per the answer key, RECEIVED MAYDAY acknowledges the distress and tells the vessel you are listening.",
"23.37":"To save the battery, switch on the life raft VHF when you receive a SART signal or see a vessel.",
"23.38":"NA23: station N, subject A, serial number 23.",
"24.1":"Per the answer key, the operator chooses which subject indicators to reject, and messages with those subject letters are rejected.",
"24.2":"For routine communication at short range, use low power (1 W) whether it is day or night.",
"24.3":"COSPAS-SARSAT is a search and rescue system and is not used for commercial broadcasts.",
"24.4":"The satellite EPIRB is the primary GMDSS means of locating ships or life rafts in distress.",
"24.5":"Per the answer key, the radio station logbook is required.",
"24.6":"All three are AIS identities: 99 is an AIS aid to navigation, 970 an AIS-SART, and 428 a ship's AIS (Israel)."
};

// ---------- topic banks ----------
const TOPICS = [
  { id: "epirb", name: "EPIRB", note: "Beacons, COSPAS-SARSAT, LUT/MCC",
    re: /EPIRB|GPIRB|COSPAS|SARSAT|406|121\.5|LUT|MCC|Inmarsat-E|[Bb]eacon/ },
  { id: "vhf", name: "VHF", note: "Channels, power and equipment",
    re: /VHF|CH\d|[Cc]hannel|Watt|Squelch|Dual Watch|transceiver/ },
  { id: "sart", name: "SART", note: "Radar transponder and X-Band",
    re: /SART|radar transponder|X-Band/ },
  { id: "dsc", name: "DSC", note: "Channel 70, MMSI and MID",
    re: /DSC|MMSI|MID|G2B|channel 70|CH70/ },
  { id: "navtex", name: "NAVTEX", note: "518KHz, MSI and message codes",
    re: /NAVTEX|Navtex|518|490KHz|MSI|Maritime Safety|Navarea|CER=/ },
  { id: "proc", name: "Voice procedures", note: "MAYDAY, PANPAN, SECURITE, spelling and calling procedures",
    re: /MAYDAY|Mayday|PANPAN|PAN PAN|SECURITE|SEELONCE|PRUDONCE|\bTR\b|T\.L|Traffic List|[Ss]pell|[Pp]honetic|abbreviated call|[Cc]ontrols?\b|[Pp]riority|[Uu]rgency|Relay|RELAY|Over\b|Stand-by|radio exchange|distress call|end of (a |the )?distress|end with|call sign|safety signal|safety call|Distress messages|Safety messages|CONTROL|identification|Radio\b|ALBERTA|Napoli/ }
];
// questions the keyword pass misses, tagged by hand (exam.question of first appearance)
const MANUAL = {
  "1.3":"proc","1.16":"dsc","1.17":"proc","2.3":"vhf","2.4":"dsc","2.14":"proc","2.15":"navtex",
  "3.16":"dsc vhf","3.19":"proc","4.1":"proc","4.2":"proc","4.13":"dsc","5.4":"epirb","6.2":"vhf",
  "6.8":"dsc","6.10":"proc","6.14":"proc vhf","6.18":"proc","6.20":"dsc proc","7.1":"dsc epirb",
  "7.8":"epirb sart","7.11":"proc","7.17":"proc","8.1":"proc","8.14":"dsc","8.18":"vhf","8.19":"dsc",
  "8.20":"proc","9.18":"vhf","10.1":"navtex dsc","10.5":"navtex","11.1":"dsc proc","11.5":"dsc",
  "11.9":"proc","12.4":"vhf","12.6":"proc","14.4":"proc","14.6":"dsc proc","14.18":"epirb",
  "15.2":"vhf proc","15.3":"proc","15.13":"dsc epirb","15.16":"dsc navtex","16.1":"dsc proc",
  "16.5":"sart epirb","16.11":"proc","16.14":"epirb","16.15":"proc","16.16":"dsc","17.1":"dsc",
  "17.5":"navtex","18.1":"dsc","18.16":"dsc","18.19":"sart"
};
const UNIQUE = (() => {
  const seen = new Map();
  EXAMS.flat().forEach(Q => { const k = Q.text + "|" + Q.opts.join("|"); if (!seen.has(k)) seen.set(k, Q); });
  return [...seen.values()];
})();
// attach each question's explanation through its first appearance
(() => {
  const rep = new Map();
  UNIQUE.forEach(Q => rep.set(Q.text + "|" + Q.opts.join("|"), EXPL[(Q.e + 1) + "." + (Q.q + 1)] || ""));
  EXAMS.flat().forEach(Q => Q.expl = rep.get(Q.text + "|" + Q.opts.join("|")) || "");
})();
const BANK = {};
TOPICS.forEach(t => BANK[t.id] = []);
UNIQUE.forEach(Q => {
  const tags = new Set(TOPICS.filter(t => t.re.test(Q.text)).map(t => t.id));
  (MANUAL[(Q.e + 1) + "." + (Q.q + 1)] || "").split(" ").filter(Boolean).forEach(t => tags.add(t));
  tags.forEach(t => BANK[t].push(Q));
});
