import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, MessageCircle, Book, Phone, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchSupportPageSettings, fetchActiveFAQs, fetchActiveContactCards } from '@/services/support';
import { isFailure } from '@/types/api';

const SupportPage = () => {
  const { data: settings } = useQuery({
    queryKey: ['support-settings'],
    queryFn: async () => {
      const result = await fetchSupportPageSettings();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: faqs } = useQuery({
    queryKey: ['support-faqs'],
    queryFn: async () => {
      const result = await fetchActiveFAQs();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const { data: contactCards } = useQuery({
    queryKey: ['support-contact-cards'],
    queryFn: async () => {
      const result = await fetchActiveContactCards();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  const getIcon = (iconName: string) => {
    const icons: Record<string, LucideIcon> = {
      Mail,
      MessageCircle,
      Book,
      Phone,
      HelpCircle,
    };
    const Icon = icons[iconName] || HelpCircle;
    return <Icon className="h-8 w-8" />;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-muted/50 to-background py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              {settings?.page_title || 'Support Center'}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {settings?.page_description || 'How can we help you today?'}
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        {contactCards && contactCards.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Get in Touch</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contactCards.map((card) => (
                  <Card key={card.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-4 flex items-center justify-center text-primary">{getIcon(card.icon)}</div>
                      <CardTitle className="text-center">{card.title}</CardTitle>
                      <CardDescription className="text-center">{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      {card.email && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={`mailto:${card.email}`}>{card.email}</a>
                        </Button>
                      )}
                      {card.phone && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={`tel:${card.phone}`}>{card.phone}</a>
                        </Button>
                      )}
                      {card.link && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={card.link} target="_blank" rel="noopener noreferrer">
                            Visit
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQs Section */}
        {faqs && faqs.length > 0 && (
          <section className="border-t bg-muted/30 py-12">
            <div className="container mx-auto px-4">
              <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
              <div className="mx-auto max-w-3xl">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SupportPage;
