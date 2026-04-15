import { Injectable } from '@nestjs/common';

@Injectable()
export class SupportService {
  private topics = [
    {
      title: 'Order Issues',
      subtitle: 'Track and resolve wrong orders',
      icon: 'shopping_bag_outlined',
      color: '0xFFE53935',
    },
    {
      title: 'Payment Problems',
      subtitle: 'Refund status and payment issues',
      icon: 'payment_outlined',
      color: '0xFFFF6B9D',
    },
    {
      title: 'Account & Profile',
      subtitle: 'Edit profile and account settings',
      icon: 'person_outline',
      color: '0xFF9C27B0',
    },
    {
      title: 'Delivery Issues',
      subtitle: 'Late delivery tracking address',
      icon: 'delivery_dining_outlined',
      color: '0xFF2196F3',
    },
    {
      title: 'Refunds & Cancellations',
      subtitle: 'Cancel order and refund policy',
      icon: 'receipt_long_outlined',
      color: '0xFFFF9800',
    },
    {
      title: 'App Technical Support',
      subtitle: 'App crashes and bugs',
      icon: 'support_agent_outlined',
      color: '0xFF4CAF50',
    },
  ];

  private faqs = [
    {
      question: 'How do I track my order?',
      answer:
        'You can track your order in real-time by going to "Orders" tab and select your current order.',
    },
    {
      question: 'How to report a problem with my order?',
      answer:
        'Go to "My Orders", select the order, and click on "Report an Issue" at the bottom of the page.',
    },
    {
      question: 'What is your refund policy?',
      answer: 'Refunds are processed within 5-7 business days, depending on your payment method.',
    },
    {
      question: 'How can I update my delivery address?',
      answer: 'You can update your delivery address in profile settings or when placing an order.',
    },
    {
      question: 'How do I contact customer support?',
      answer: 'You can reach us through the contact options below or chat with our support team.',
    },
  ];

  findAll(query: string) {
    if (!query) {
      return { topics: this.topics, faqs: this.faqs };
    }

    const lowerQuery = query.toLowerCase();

    const filteredTopics = this.topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(lowerQuery) ||
        topic.subtitle.toLowerCase().includes(lowerQuery),
    );

    const filteredFaqs = this.faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lowerQuery) ||
        faq.answer.toLowerCase().includes(lowerQuery),
    );

    return { topics: filteredTopics, faqs: filteredFaqs };
  }
}
