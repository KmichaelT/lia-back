import type { Schema, Struct } from '@strapi/strapi';

export interface ContentBibleVerse extends Struct.ComponentSchema {
  collectionName: 'components_content_bible_verses';
  info: {
    description: 'Inspirational quote or bible verse section';
    displayName: 'Bible Verse';
    icon: 'book';
  };
  attributes: {
    attribution: Schema.Attribute.String;
    backgroundImage: Schema.Attribute.Media<'images'>;
    quote: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface ContentNewsletterSection extends Struct.ComponentSchema {
  collectionName: 'components_content_newsletter_sections';
  info: {
    description: 'Newsletter signup section';
    displayName: 'Newsletter Section';
    icon: 'envelope';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Subscribe'>;
    description: Schema.Attribute.Text;
    formActionUrl: Schema.Attribute.String;
    placeholderText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Enter your email'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContentTimelineItem extends Struct.ComponentSchema {
  collectionName: 'components_content_timeline_items';
  info: {
    description: 'Individual timeline entry';
    displayName: 'Timeline Item';
    icon: 'clock';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    endYear: Schema.Attribute.String;
    startYear: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'content.bible-verse': ContentBibleVerse;
      'content.newsletter-section': ContentNewsletterSection;
      'content.timeline-item': ContentTimelineItem;
    }
  }
}
