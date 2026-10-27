import type { Lang } from '../lib/types';

/**
 * What the cited text teaches, in plain words, for each dharma principle: the moral shown with the source
 * (for example Bhagavad Gita 17.15 for harsh speech). Paraphrases for reflection, not translations of the verse.
 */
export const PRINCIPLE_MORAL: Record<string, Record<Lang, string>> = {
  paropakara: {
    en: 'Helping others brings merit; hurting others brings sin. A life of service is a life of dharma.',
    gu: 'બીજાને મદદ કરવાથી પુણ્ય મળે છે, બીજાને પીડા આપવાથી પાપ. સેવાનું જીવન જ ધર્મનું જીવન છે.',
    hi: 'दूसरों की मदद से पुण्य मिलता है, दूसरों को पीड़ा देने से पाप। सेवा का जीवन ही धर्म का जीवन है।',
  },
  annadana: {
    en: 'Giving food to the hungry is among the greatest gifts, because it sustains life itself.',
    gu: 'ભૂખ્યાને ભોજન આપવું એ સૌથી મોટા દાનોમાંનું એક છે, કારણ કે તે જીવનને ટકાવે છે.',
    hi: 'भूखे को भोजन देना सबसे बड़े दानों में से एक है, क्योंकि वह जीवन को ही बनाए रखता है।',
  },
  daana: {
    en: 'A gift given as a duty, without expecting anything back, at the right time and to the right person, is pure giving.',
    gu: 'ફરજ સમજીને, બદલાની આશા વગર, યોગ્ય સમયે અને યોગ્ય વ્યક્તિને આપેલું દાન શુદ્ધ દાન છે.',
    hi: 'कर्तव्य समझकर, बदले की आशा के बिना, सही समय पर और योग्य व्यक्ति को दिया गया दान शुद्ध दान है।',
  },
  go_jeev_seva: {
    en: 'Compassion to every living being, including cows, animals and birds, is part of dharma.',
    gu: 'ગાય, પશુ-પક્ષી સહિત દરેક જીવ પ્રત્યેની કરુણા ધર્મનો ભાગ છે.',
    hi: 'गाय, पशु-पक्षी सहित हर जीव के प्रति करुणा धर्म का ही हिस्सा है।',
  },
  matri_pitri_seva: {
    en: 'Honour your mother, father and teacher as divine. Serving them is the first duty.',
    gu: 'માતા, પિતા અને ગુરુને દેવ સમાન માનીને સન્માન આપો. તેમની સેવા પ્રથમ ફરજ છે.',
    hi: 'माता, पिता और गुरु को देवता के समान मानकर सम्मान दें। उनकी सेवा पहला कर्तव्य है।',
  },
  atithi_seva: {
    en: 'Treat the guest as God. Welcoming and feeding a visitor is a sacred duty.',
    gu: 'અતિથિને દેવ સમાન ગણો. મહેમાનનું સ્વાગત અને ભોજન કરાવવું પવિત્ર ફરજ છે.',
    hi: 'अतिथि को देवता के समान मानें। मेहमान का स्वागत और भोजन कराना पवित्र कर्तव्य है।',
  },
  satya: {
    en: 'Speak the truth and follow dharma. Truth is the foundation that every other virtue stands on.',
    gu: 'સત્ય બોલો અને ધર્મનું પાલન કરો. સત્ય એ પાયો છે જેના પર બીજા બધા સદ્ગુણો ટકે છે.',
    hi: 'सत्य बोलें और धर्म का पालन करें। सत्य वह नींव है जिस पर बाकी सारे सद्गुण टिके हैं।',
  },
  kshama: {
    en: 'Anger, desire and greed lead to ruin. Forgiveness and calm in the face of provocation are strength, not weakness.',
    gu: 'ક્રોધ, કામના અને લોભ પતન તરફ લઈ જાય છે. ઉશ્કેરાટમાં ક્ષમા અને શાંતિ રાખવી એ નબળાઈ નહીં, શક્તિ છે.',
    hi: 'क्रोध, कामना और लोभ पतन की ओर ले जाते हैं। उकसावे में क्षमा और शांति रखना कमज़ोरी नहीं, शक्ति है।',
  },
  dama_shaucha: {
    en: 'Be moderate in eating, rest, work and recreation. Balance and self-control end suffering.',
    gu: 'ખાવા-પીવા, આરામ, કામ અને મનોરંજનમાં સંયમ રાખો. સંતુલન અને આત્મસંયમ દુઃખનો અંત લાવે છે.',
    hi: 'खाने-पीने, आराम, काम और मनोरंजन में संयम रखें। संतुलन और आत्मसंयम दुख का अंत करते हैं।',
  },
  bhakti_sadhana: {
    en: 'Whatever you do, eat, give or practise, offer it with devotion. Ordinary acts become sacred when offered.',
    gu: 'તમે જે કરો, ખાઓ, આપો કે સાધના કરો, તે ભક્તિભાવથી અર્પણ કરો. અર્પણ કરવાથી સામાન્ય કર્મ પણ પવિત્ર બને છે.',
    hi: 'जो भी करें, खाएँ, दें या साधना करें, उसे भक्तिभाव से अर्पित करें। अर्पण से साधारण कर्म भी पवित्र हो जाते हैं।',
  },
  svadharma: {
    en: 'Do your own duty honestly, even if imperfectly. Work done as worship, without envy of others, leads to fulfilment.',
    gu: 'તમારી પોતાની ફરજ પ્રામાણિકતાથી કરો, ભલે અપૂર્ણ હોય. બીજાની ઈર્ષ્યા વગર, પૂજા સમજીને કરેલું કામ સિદ્ધિ તરફ લઈ જાય છે.',
    hi: 'अपना कर्तव्य ईमानदारी से करें, भले अधूरा हो। दूसरों से ईर्ष्या किए बिना, पूजा समझकर किया काम सिद्धि की ओर ले जाता है।',
  },
  vidya_dana: {
    en: 'Knowledge is a mark of dharma, and sharing it is a gift that grows when given.',
    gu: 'વિદ્યા ધર્મનું લક્ષણ છે, અને તેને વહેંચવું એવું દાન છે જે આપવાથી વધે છે.',
    hi: 'विद्या धर्म का लक्षण है, और उसे बाँटना ऐसा दान है जो देने से बढ़ता है।',
  },
  ahimsa: {
    en: 'Non-violence is the highest dharma: in deed, in word, in thought and in what we eat.',
    gu: 'અહિંસા પરમ ધર્મ છે: કર્મમાં, વાણીમાં, વિચારમાં અને આહારમાં.',
    hi: 'अहिंसा परम धर्म है: कर्म, वाणी, विचार और आहार में।',
  },
  himsa: {
    en: 'Violence against living beings is the gravest wrong. Protect life rather than harm it.',
    gu: 'જીવો પ્રત્યેની હિંસા સૌથી ગંભીર પાપ છે. જીવને નુકસાન કરવાને બદલે તેનું રક્ષણ કરો.',
    hi: 'जीवों के प्रति हिंसा सबसे गंभीर पाप है। जीवन को हानि पहुँचाने के बजाय उसकी रक्षा करें।',
  },
  para_pida: {
    en: 'Causing pain to others is sin. Before you act or speak, ask whether it will hurt someone.',
    gu: 'બીજાને પીડા આપવી એ પાપ છે. કંઈ કરતાં કે બોલતાં પહેલાં વિચારો કે તેનાથી કોઈને દુઃખ તો નહીં થાય.',
    hi: 'दूसरों को पीड़ा देना पाप है। कुछ करने या बोलने से पहले सोचें कि उससे किसी को दुख तो नहीं होगा।',
  },
  asatya: {
    en: 'Untruth breaks the trust that dharma rests on. Say what is true, and keep your promises.',
    gu: 'અસત્ય એ વિશ્વાસ તોડે છે જેના પર ધર્મ ટકે છે. જે સત્ય છે તે કહો અને વચન પાળો.',
    hi: 'असत्य उस विश्वास को तोड़ता है जिस पर धर्म टिका है। जो सच है वही कहें और वचन निभाएँ।',
  },
  steya: {
    en: 'Do not take what is not yours. Honest earning is dharma; theft and cheating are not.',
    gu: 'જે તમારું નથી તે ન લો. પ્રામાણિક કમાણી ધર્મ છે; ચોરી અને છેતરપિંડી નહીં.',
    hi: 'जो आपका नहीं है उसे न लें। ईमानदार कमाई धर्म है; चोरी और धोखा नहीं।',
  },
  krodha: {
    en: 'From anger comes confusion, then loss of memory, then loss of reason, and finally ruin. Calm the mind before you act.',
    gu: 'ક્રોધથી મૂંઢતા આવે છે, પછી સ્મૃતિ નાશ, પછી બુદ્ધિ નાશ અને અંતે પતન. કર્મ કરતાં પહેલાં મનને શાંત કરો.',
    hi: 'क्रोध से मोह उपजता है, फिर स्मृति का नाश, फिर बुद्धि का नाश और अंत में पतन। कर्म करने से पहले मन को शांत करें।',
  },
  parusha_vani: {
    en: 'Speech that causes no distress, that is truthful, pleasant and beneficial, is the discipline of speech. Harsh words wound and are not part of it.',
    gu: 'જે વાણી કોઈને દુઃખ ન આપે, સત્ય, પ્રિય અને હિતકારી હોય, તે વાણીનું તપ છે. કઠોર શબ્દો ઘા કરે છે અને તેમાં ગણાતા નથી.',
    hi: 'जो वाणी किसी को दुख न दे, सत्य, प्रिय और हितकारी हो, वही वाणी का तप है। कठोर शब्द घाव करते हैं और उसमें नहीं आते।',
  },
  lobha_ahankara: {
    en: 'Desire, anger and greed are three gates to ruin. Pride and envy grow from them, so let them go.',
    gu: 'કામ, ક્રોધ અને લોભ પતનના ત્રણ દરવાજા છે. અભિમાન અને ઈર્ષ્યા તેમાંથી જન્મે છે, તેથી તેમને છોડો.',
    hi: 'काम, क्रोध और लोभ पतन के तीन द्वार हैं। अभिमान और ईर्ष्या इन्हीं से जन्म लेते हैं, इसलिए इन्हें छोड़ें।',
  },
  pramada_vyasana: {
    en: 'Yoga ends sorrow for the one who is moderate in food, recreation, work, sleep and waking. Laziness and addiction pull us away from our duty.',
    gu: 'જે ખાવા-પીવા, મનોરંજન, કામ, ઊંઘ અને જાગરણમાં સંયમી છે તેનું દુઃખ યોગ દૂર કરે છે. આળસ અને વ્યસન આપણને ફરજથી દૂર ખેંચે છે.',
    hi: 'जो खान-पान, मनोरंजन, काम, नींद और जागरण में संयमी है उसका दुख योग दूर करता है। आलस्य और व्यसन हमें कर्तव्य से दूर खींचते हैं।',
  },
  matri_pitri_anadara: {
    en: 'Honour mother and father as divine. Neglecting or insulting them breaks the first duty.',
    gu: 'માતા અને પિતાને દેવ સમાન માનો. તેમની ઉપેક્ષા કે અપમાન પ્રથમ ફરજનો ભંગ છે.',
    hi: 'माता और पिता को देवता के समान मानें। उनकी उपेक्षा या अपमान पहले कर्तव्य का भंग है।',
  },
  seva_upeksha: {
    en: 'Turning away from someone in real need when you are able to help is a failure of dharma.',
    gu: 'મદદ કરવા સમર્થ હોવા છતાં સાચા જરૂરિયાતમંદથી મોં ફેરવી લેવું એ ધર્મની ચૂક છે.',
    hi: 'मदद करने में समर्थ होकर भी सचमुच ज़रूरतमंद से मुँह फेर लेना धर्म की चूक है।',
  },
  maitri_karuna: {
    en: 'The one who hates no being, who is friendly and compassionate, is dear to the Lord.',
    gu: 'જે કોઈ જીવનો દ્વેષ કરતો નથી, જે મૈત્રીભાવ અને કરુણા રાખે છે, તે ભગવાનને પ્રિય છે.',
    hi: 'जो किसी जीव से द्वेष नहीं करता, जो मैत्री और करुणा रखता है, वह भगवान को प्रिय है।',
  },
  manah_prasada: {
    en: 'A calm, gentle and pure mind, with self-control and restraint in speech, is the discipline of the mind.',
    gu: 'શાંત, સૌમ્ય અને શુદ્ધ મન, આત્મસંયમ અને વાણીમાં સંયમ, એ મનનું તપ છે.',
    hi: 'शांत, सौम्य और शुद्ध मन, आत्मसंयम और वाणी में संयम, यही मन का तप है।',
  },
  shubha_sankalpa: {
    en: 'May my mind be filled with good resolve. A good intention, held sincerely, is the seed of a good deed.',
    gu: 'મારું મન શુભ સંકલ્પવાળું બનો. સાચા દિલથી રાખેલો શુભ ઇરાદો સારા કર્મનું બીજ છે.',
    hi: 'मेरा मन शुभ संकल्प वाला हो। सच्चे मन से रखा शुभ इरादा अच्छे कर्म का बीज है।',
  },
  pashchattapa: {
    en: 'The more honestly a person regrets a wrong and owns it, the more they are freed from it, like a snake leaving its old skin.',
    gu: 'માણસ જેટલો પ્રામાણિકતાથી ભૂલનો પસ્તાવો કરે અને સ્વીકારે, તેટલો તેમાંથી મુક્ત થાય છે, જેમ સાપ જૂની કાંચળી છોડે છે.',
    hi: 'मनुष्य जितनी ईमानदारी से भूल का पछतावा करता और स्वीकारता है, उतना ही उससे मुक्त होता है, जैसे साँप पुरानी केंचुली छोड़ता है।',
  },
  dvesha_irshya: {
    en: 'Hatred and envy darken the mind and harm the one who holds them. Ill will toward others is counted among the sins of the mind.',
    gu: 'દ્વેષ અને ઈર્ષ્યા મનને અંધારું કરે છે અને તેને રાખનારને જ નુકસાન કરે છે. બીજા પ્રત્યેનો અશુભ ભાવ મનના પાપોમાં ગણાય છે.',
    hi: 'द्वेष और ईर्ष्या मन को अँधेरा करते हैं और उन्हें रखने वाले को ही हानि पहुँचाते हैं। दूसरों के प्रति अशुभ भाव मन के पापों में गिना जाता है।',
  },
  abhidhya: {
    en: 'Coveting what belongs to others is a sin of the mind. Contentment with what we have brings peace.',
    gu: 'બીજાની વસ્તુનો લોભ રાખવો એ મનનું પાપ છે. જે છે તેમાં સંતોષ શાંતિ આપે છે.',
    hi: 'दूसरे की वस्तु का लालच रखना मन का पाप है। जो है उसमें संतोष शांति देता है।',
  },
  ashubha_sankalpa: {
    en: 'Plotting harm and nursing thoughts of revenge feed pride and ruin the mind, and the tradition counts ill thoughts as a sin of the mind.',
    gu: 'નુકસાન કરવાનું કાવતરું અને બદલાના વિચારો અહંકારને પોષે છે અને મનને બગાડે છે; પરંપરા અશુભ વિચારને મનનું પાપ ગણે છે.',
    hi: 'हानि की योजना और बदले के विचार अहंकार को पोषते हैं और मन को बिगाड़ते हैं; परंपरा अशुभ विचार को मन का पाप मानती है।',
  },
};

export function principleMoral(id: string, lang: Lang): string {
  return PRINCIPLE_MORAL[id]?.[lang] ?? '';
}
