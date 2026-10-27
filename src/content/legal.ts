import type { Lang } from '../lib/types';

export interface Section {
  h: string;
  p: string;
}

export const LEGAL_UPDATED = '2026-10-26';

/**
 * Plain-language policy, written for the Digital Personal Data Protection Act, 2023 (India).
 * Have a lawyer review it and replace the contact address before launch.
 */
export const PRIVACY: Record<Lang, Section[]> = {
  en: [
    { h: 'What we store', p: 'Your profile (name, language, tradition, goals, city, reminder time), the text of what you tell Karma (only if "Keep my words" is on), the actions identified from it with their scores and reasons, your reflections and Pratikraman notes. Saved text is encrypted at rest (AES-256-GCM) and is never displayed back in the app. We never store audio. To show how many people have visited, your browser keeps a random anonymous ID (no name, email or other personal data) that is counted once in our database; turn on Do Not Track and you are not counted at all.' },
    { h: 'Why we store it', p: 'Only to show your ghadas, charts and reflections, and to let you review your own growth. We do not sell your data, show ads or use analytics trackers.' },
    { h: 'AI processing by a third party', p: 'To find actions in your words, the text you submit is sent from our server to a third-party AI provider (Google Gemini by default; Groq, Anthropic or OpenAI if the operator chooses). The provider processes it to return a result. Your name and email are not sent. Please do not include other people\'s sensitive personal details.' },
    { h: 'Voice', p: 'If you use the microphone, your browser\'s speech recognition service (for example Google in Chrome) converts speech to text on your behalf. Karma never receives or stores audio. You can always type instead.' },
    { h: 'Retention', p: 'Your data is kept until you delete it or delete your account. Turn off "Keep my words" to delete the text of each entry right after analysis; the actions and scores remain.' },
    { h: 'Your rights', p: 'You can view, correct, export (JSON/CSV) and permanently delete your data from Profile at any time. Deleting your account removes your login and all rows linked to it. You may withdraw consent by deleting your account.' },
    { h: 'Safety', p: 'Karma is a reflection tool, not therapy or medical advice. If your words suggest you may harm yourself or others, we do not score them and we show helpline information (Tele-MANAS 14416 in India).' },
    { h: 'Children', p: 'Karma is meant for adults. Under the DPDP Act, children under 18 need verifiable parental consent.' },
    { h: 'Contact', p: 'Questions or requests: privacy@karma.example (replace with the operator\'s address). The operator is the data fiduciary.' },
  ],
  hi: [
    { h: 'हम क्या सहेजते हैं', p: 'आपकी प्रोफ़ाइल (नाम, भाषा, परंपरा, लक्ष्य, शहर, अनुस्मारक समय), आपने कर्म को जो बताया उसका पाठ ("मेरे शब्द सहेजें" चालू होने पर ही), उससे पहचाने गए कर्म, अंक व कारण, आपके चिंतन और प्रतिक्रमण नोट। सहेजा गया पाठ एन्क्रिप्ट (AES-256-GCM) करके रखा जाता है और ऐप में दोबारा कभी नहीं दिखाया जाता। हम कभी ऑडियो नहीं सहेजते। कितने लोग आए यह दिखाने के लिए आपका ब्राउज़र एक यादृच्छिक गुमनाम आईडी रखता है (कोई नाम, ईमेल या निजी जानकारी नहीं) जिसे हमारे डेटाबेस में एक बार गिना जाता है; Do Not Track चालू करने पर आपको बिल्कुल नहीं गिना जाता।' },
    { h: 'क्यों सहेजते हैं', p: 'केवल आपके घड़े, चार्ट और चिंतन दिखाने तथा आपकी अपनी प्रगति देखने के लिए। हम आपका डेटा नहीं बेचते, विज्ञापन या ट्रैकर नहीं रखते।' },
    { h: 'तृतीय-पक्ष AI द्वारा प्रसंस्करण', p: 'कर्म पहचानने के लिए आपका भेजा पाठ हमारे सर्वर से तृतीय-पक्ष AI प्रदाता (डिफ़ॉल्ट Google Gemini; संचालक चाहे तो Groq, Anthropic या OpenAI) को भेजा जाता है। आपका नाम और ईमेल नहीं भेजा जाता। कृपया दूसरों की संवेदनशील निजी जानकारी न लिखें।' },
    { h: 'आवाज़', p: 'माइक्रोफ़ोन उपयोग करने पर आपका ब्राउज़र (जैसे Chrome में Google) आपकी ओर से बोली को पाठ में बदलता है। कर्म को ऑडियो कभी नहीं मिलता और न सहेजा जाता है। आप हमेशा लिख सकते हैं।' },
    { h: 'अवधि', p: 'आपका डेटा तब तक रखा जाता है जब तक आप उसे या अपना खाता हटा नहीं देते। "मेरे शब्द सहेजें" बंद करने पर हर प्रविष्टि का पाठ विश्लेषण के तुरंत बाद हट जाता है; कर्म और अंक रहते हैं।' },
    { h: 'आपके अधिकार', p: 'आप प्रोफ़ाइल से कभी भी अपना डेटा देख, सुधार, एक्सपोर्ट (JSON/CSV) और स्थायी रूप से हटा सकते हैं। खाता हटाने पर आपका लॉगिन और उससे जुड़ी सभी पंक्तियाँ हट जाती हैं। खाता हटाकर आप सहमति वापस ले सकते हैं।' },
    { h: 'सुरक्षा', p: 'कर्म चिंतन का साधन है, चिकित्सा या थेरेपी नहीं। यदि आपके शब्दों से स्वयं या दूसरों को हानि का संकेत मिले तो हम अंक नहीं देते और हेल्पलाइन जानकारी (भारत में Tele-MANAS 14416) दिखाते हैं।' },
    { h: 'बच्चे', p: 'कर्म वयस्कों के लिए है। DPDP अधिनियम के अंतर्गत 18 वर्ष से कम आयु के बच्चों के लिए सत्यापित अभिभावकीय सहमति आवश्यक है।' },
    { h: 'संपर्क', p: 'प्रश्न या अनुरोध: privacy@karma.example (संचालक के पते से बदलें)। संचालक डेटा फिड्यूशियरी है।' },
  ],
  gu: [
    { h: 'અમે શું સાચવીએ છીએ', p: 'તમારી પ્રોફાઇલ (નામ, ભાષા, પરંપરા, લક્ષ્યો, શહેર, રિમાઇન્ડર સમય), તમે કર્મને જે કહ્યું તેનું લખાણ (ફક્ત "મારા શબ્દો સાચવો" ચાલુ હોય ત્યારે), તેમાંથી ઓળખાયેલા કાર્યો, ગુણ અને કારણો, તમારા ચિંતન અને પ્રતિક્રમણ નોંધો. સાચવેલું લખાણ એન્ક્રિપ્ટ (AES-256-GCM) કરીને રખાય છે અને એપમાં ફરી ક્યારેય બતાવાતું નથી. અમે ક્યારેય ઑડિયો સાચવતા નથી. કેટલા લોકોએ મુલાકાત લીધી તે બતાવવા તમારું બ્રાઉઝર એક રેન્ડમ અનામી ID રાખે છે (નામ, ઇમેઇલ કે અંગત માહિતી નથી) જેની અમારા ડેટાબેઝમાં એક વાર ગણતરી થાય છે; Do Not Track ચાલુ કરશો તો તમારી ગણતરી બિલકુલ થશે નહીં.' },
    { h: 'શા માટે સાચવીએ છીએ', p: 'ફક્ત તમારા ઘડા, ચાર્ટ અને ચિંતન બતાવવા અને તમારી પોતાની પ્રગતિ જોવા માટે. અમે તમારો ડેટા વેચતા નથી, જાહેરાતો કે ટ્રેકર્સ રાખતા નથી.' },
    { h: 'ત્રીજા પક્ષ દ્વારા AI પ્રક્રિયા', p: 'કાર્યો ઓળખવા માટે તમે મોકલેલું લખાણ અમારા સર્વરથી ત્રીજા પક્ષના AI પ્રદાતા (ડિફૉલ્ટ Google Gemini; સંચાલક ઇચ્છે તો Groq, Anthropic અથવા OpenAI) ને મોકલાય છે. તમારું નામ અને ઇમેઇલ મોકલાતા નથી. કૃપા કરીને બીજાની સંવેદનશીલ અંગત માહિતી ન લખો.' },
    { h: 'અવાજ', p: 'માઇક્રોફોન વાપરો ત્યારે તમારું બ્રાઉઝર (જેમ કે Chrome માં Google) તમારા વતી બોલાયેલું લખાણમાં ફેરવે છે. કર્મને ઑડિયો ક્યારેય મળતો નથી કે સચવાતો નથી. તમે હંમેશા લખી શકો છો.' },
    { h: 'સમયગાળો', p: 'તમે ડેટા કે એકાઉન્ટ ડિલીટ ન કરો ત્યાં સુધી તે રહે છે. "મારા શબ્દો સાચવો" બંધ કરશો તો દરેક નોંધનું લખાણ વિશ્લેષણ પછી તરત ડિલીટ થશે; કાર્યો અને ગુણ રહેશે.' },
    { h: 'તમારા અધિકારો', p: 'તમે પ્રોફાઇલમાંથી ગમે ત્યારે તમારો ડેટા જોઈ, સુધારી, એક્સપોર્ટ (JSON/CSV) કરી અને કાયમ માટે ડિલીટ કરી શકો છો. એકાઉન્ટ ડિલીટ કરવાથી તમારું લોગિન અને તેની સાથે જોડાયેલી બધી પંક્તિઓ દૂર થાય છે. એકાઉન્ટ ડિલીટ કરીને તમે સંમતિ પાછી ખેંચી શકો છો.' },
    { h: 'સલામતી', p: 'કર્મ ચિંતનનું સાધન છે, થેરાપી કે તબીબી સલાહ નથી. જો તમારા શબ્દોમાં પોતાને કે બીજાને નુકસાનનો સંકેત હોય તો અમે ગુણ આપતા નથી અને હેલ્પલાઇન માહિતી (ભારતમાં Tele-MANAS 14416) બતાવીએ છીએ.' },
    { h: 'બાળકો', p: 'કર્મ પુખ્ત વયના લોકો માટે છે. DPDP કાયદા હેઠળ 18 વર્ષથી નાનાં બાળકો માટે ચકાસાયેલી વાલીની સંમતિ જરૂરી છે.' },
    { h: 'સંપર્ક', p: 'પ્રશ્નો કે વિનંતીઓ: privacy@karma.example (સંચાલકના સરનામાથી બદલો). સંચાલક ડેટા ફિડ્યુશિયરી છે.' },
  ],
};

export const TERMS: Record<Lang, Section[]> = {
  en: [
    { h: 'Purpose', p: 'Karma is a tool for spiritual self-reflection. It is not religious authority, therapy, or medical, legal or financial advice.' },
    { h: 'AI can be wrong', p: 'Scores are produced by an AI using a published rubric. They can be imperfect. Use the "I disagree" option to tell us; the score stays as analysed. Never use Karma to judge another person.' },
    { h: 'Your account', p: 'Keep your login private. You are responsible for what you enter. Do not submit unlawful content or other people\'s sensitive personal data.' },
    { h: 'Availability', p: 'The service is provided as is, without warranty, and may change or pause. Please export what matters to you.' },
    { h: 'Ending use', p: 'You can delete your account and all data at any time from Profile.' },
  ],
  hi: [
    { h: 'उद्देश्य', p: 'कर्म आध्यात्मिक आत्म-चिंतन का साधन है। यह धार्मिक सत्ता, थेरेपी या चिकित्सा, कानूनी अथवा वित्तीय सलाह नहीं है।' },
    { h: 'AI ग़लत हो सकता है', p: 'अंक प्रकाशित मापदंड के आधार पर AI देता है और अपूर्ण हो सकते हैं। "मैं असहमत हूँ" से बताइए; अंक विश्लेषण के अनुसार ही रहते हैं। कर्म का उपयोग दूसरे को आँकने के लिए कभी न करें।' },
    { h: 'आपका खाता', p: 'अपना लॉगिन गोपनीय रखें। आप जो लिखते हैं उसकी ज़िम्मेदारी आपकी है। अवैध सामग्री या दूसरों की संवेदनशील निजी जानकारी न डालें।' },
    { h: 'उपलब्धता', p: 'सेवा "जैसी है" बिना वारंटी दी जाती है और बदल या रुक सकती है। जो महत्वपूर्ण हो उसे एक्सपोर्ट कर लें।' },
    { h: 'उपयोग समाप्त करना', p: 'आप प्रोफ़ाइल से कभी भी अपना खाता और सारा डेटा हटा सकते हैं।' },
  ],
  gu: [
    { h: 'હેતુ', p: 'કર્મ આધ્યાત્મિક આત્મ-ચિંતનનું સાધન છે. તે ધાર્મિક સત્તા, થેરાપી કે તબીબી, કાનૂની અથવા નાણાકીય સલાહ નથી.' },
    { h: 'AI ખોટું પણ હોઈ શકે', p: 'ગુણ AI દ્વારા જાહેર માપદંડ મુજબ અપાય છે અને અપૂર્ણ હોઈ શકે. "હું અસંમત છું" વડે જણાવો; ગુણ વિશ્લેષણ મુજબ જ રહે છે. કર્મનો ઉપયોગ બીજાને ન્યાય તોળવા ક્યારેય ન કરો.' },
    { h: 'તમારું એકાઉન્ટ', p: 'તમારું લોગિન ગુપ્ત રાખો. તમે જે લખો તેની જવાબદારી તમારી છે. ગેરકાનૂની સામગ્રી કે બીજાની સંવેદનશીલ અંગત માહિતી ન નાખો.' },
    { h: 'ઉપલબ્ધતા', p: 'સેવા "જેવી છે તેવી" વૉરંટી વિના અપાય છે અને બદલાઈ કે અટકી શકે. જે મહત્ત્વનું હોય તે એક્સપોર્ટ કરી લો.' },
    { h: 'ઉપયોગ બંધ કરવો', p: 'તમે પ્રોફાઇલમાંથી ગમે ત્યારે તમારું એકાઉન્ટ અને બધો ડેટા ડિલીટ કરી શકો છો.' },
  ],
};
