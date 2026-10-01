/** Sohbet listesinde görünen hikaye kimliği. Hikaye içeriği (düğümler) Faz 2–3'te eklenecek. */
export type CharacterMeta = {
  /** Başlıkta ve bildirimlerde görünen isim */
  name: string;
  avatar: { initials: string; color: string };
};

export type StoryMeta = {
  id: string;
  title: string;
  character: CharacterMeta;
  /** Kilitli hikayeler listede "yakında" olarak görünür, açılmaz */
  locked: boolean;
  /** Kilitliyken liste satırında gösterilen kısa tanıtım */
  teaser?: string;
};
