import { ContentCreateData } from '../services/content.service'

// Example function to demonstrate importing news content
export function createNewsArticleData(data: {
  title: string
  titleAr?: string
  summary: string
  summaryAr?: string
  content: string
  contentAr?: string
  category?: string
  tags?: string[]
  imageUrl?: string
  author?: string
  sourceUrl?: string
}): ContentCreateData {
  return {
    type: 'news',
    title: data.title,
    titleAr: data.titleAr || data.title, // Fallback to English if Arabic not provided
    content: data.content,
    contentAr: data.contentAr || data.content, // Fallback to English if Arabic not provided
    metadata: {
      category: data.category || 'health',
      tags: data.tags || [],
      author: data.author,
      imageUrl: data.imageUrl,
      url: data.sourceUrl,
      summary: data.summary,
      summaryAr: data.summaryAr,
      publishNow: true,
      isFeatured: false,
      isBreaking: false
    }
  }
}

// Example of how to format the Khaleej Times article
export const khaleejiTimesArticleExample = createNewsArticleData({
  title: "UAE doctors warn rare cardiac risks from insect stings after billionaire death",
  titleAr: "أطباء الإمارات يحذرون من مخاطر قلبية نادرة من لدغات الحشرات بعد وفاة ملياردير",
  summary: "UAE medical experts highlight the rare but serious cardiac complications that can arise from insect stings, following the death of a billionaire from an allergic reaction.",
  summaryAr: "يسلط خبراء طبيون في دولة الإمارات الضوء على المضاعفات القلبية النادرة ولكن الخطيرة التي يمكن أن تنشأ من لدغات الحشرات، بعد وفاة ملياردير من رد فعل تحسسي.",
  content: `UAE doctors are warning about the rare but potentially fatal cardiac risks associated with insect stings, following the recent death of a billionaire who suffered a severe allergic reaction.

Medical experts in the UAE are emphasizing the importance of recognizing and promptly treating anaphylactic reactions, which can occur from bee stings, wasp stings, and other insect bites. While most people experience only mild reactions, some individuals can develop life-threatening complications.

"Anaphylaxis is a severe, whole-body allergic reaction that can lead to cardiac arrest within minutes," explained doctors. "It's crucial for people with known allergies to carry epinephrine auto-injectors and seek immediate medical attention."

The medical community is using this tragic incident to raise awareness about:
- The importance of allergy testing
- Carrying emergency medication
- Recognizing symptoms of severe allergic reactions
- Seeking immediate medical help

Symptoms of anaphylaxis include difficulty breathing, rapid pulse, dizziness, and swelling of the face and throat. Anyone experiencing these symptoms after an insect sting should call emergency services immediately.`,
  contentAr: `يحذر الأطباء في دولة الإمارات من المخاطر القلبية النادرة ولكن المميتة المحتملة المرتبطة بلدغات الحشرات، بعد الوفاة الأخيرة لملياردير عانى من رد فعل تحسسي شديد.

يؤكد الخبراء الطبيون في دولة الإمارات على أهمية التعرف على ردود الفعل التأقية وعلاجها على الفور، والتي يمكن أن تحدث من لسعات النحل ولسعات الدبابير ولدغات الحشرات الأخرى. في حين أن معظم الناس يعانون فقط من ردود فعل خفيفة، يمكن لبعض الأفراد تطوير مضاعفات تهدد الحياة.

"الحساسية المفرطة هي رد فعل تحسسي شديد في الجسم كله يمكن أن يؤدي إلى السكتة القلبية في غضون دقائق"، أوضح الأطباء. "من الضروري للأشخاص الذين يعانون من الحساسية المعروفة أن يحملوا حاقنات الإبينفرين الآلية ويطلبوا العناية الطبية الفورية."

يستخدم المجتمع الطبي هذا الحادث المأساوي لزيادة الوعي حول:
- أهمية اختبار الحساسية
- حمل الأدوية الطارئة
- التعرف على أعراض ردود الفعل التحسسية الشديدة
- طلب المساعدة الطبية الفورية

تشمل أعراض الحساسية المفرطة صعوبة التنفس، وسرعة النبض، والدوخة، وتورم الوجه والحلق. يجب على أي شخص يعاني من هذه الأعراض بعد لدغة حشرة الاتصال بخدمات الطوارئ على الفور.`,
  category: "health",
  tags: ["health", "medical", "safety", "allergies", "emergency"],
  author: "Khaleej Times Health Desk",
  sourceUrl: "https://www.khaleejtimes.com/lifestyle/health/uae-doctors-warn-rare-cardiac-risks-insects-stings-billionaire-death",
  imageUrl: "https://example.com/insect-sting-medical-image.jpg" // You would need to upload the actual image
})

// Function to import multiple articles
export async function importNewsArticles(articles: ContentCreateData[], userId: string) {
  const { dashboardService } = await import('../services/dashboard.service')
  
  const results = []
  for (const article of articles) {
    try {
      const created = await dashboardService.createContent(article, userId)
      results.push({ success: true, content: created })
    } catch (error) {
      results.push({ success: false, error, data: article })
    }
  }
  
  return results
}