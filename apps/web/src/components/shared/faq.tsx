"use client";
import { Plus } from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../animation/accordin-animate";
import AnimatedContent from "@/components/animation/animate";

export function FAQ() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-20 bg-white">
      <AnimatedContent
        distance={60}
        direction="horizontal"
        reverse={false}
        delay={0.1}
      >
        <div>
          <h2 className="font-serif text-5xl leading-tight text-gray-900">
            Things
            <br />
            buyers ask
          </h2>
          <p className="text-gray-600 mt-4">
            Answers to common questions about shopping with Cani.
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent
        distance={60}
        direction="horizontal"
        reverse={true}
        delay={0.15}
      >
        <div>
          <Accordion
            className="flex w-full flex-col"
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            variants={{
              expanded: { opacity: 1, scale: 1 },
              collapsed: { opacity: 0, scale: 0.7 },
            }}
          >
            <AccordionItem
              value="what-is-cani"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">What exactly does Cani do?</div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Cani is a shared shopping board where you search stores, add items to a room, vote with friends, and track price drops and new product launches.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="how-does-watching-work"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">How does watching a product work?</div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Watch any product or search query. Cani runs scheduled checks (every 30 minutes, hourly, or daily) and creates an alert when a price drops or changes.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="how-fast-am-i-notified"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">How fast am I notified?</div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Notifications arrive when a scheduled check detects a price drop or new match, with updates shown in the app and sent by email.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="watch-for-someone-else"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">
                  Can I watch products for a group?
                </div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Yes. When you watch a product inside a shared room, every member of that room receives alerts when prices drop.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="which-sites-supported"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">Which sites are supported?</div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Search supports Flipkart, Amazon.in and Myntra in India, plus Amazon, Walmart and Best Buy in the US. You can paste any product link into a room.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="is-it-free"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">Is Cani free to use?</div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Cani is completely free to use during early access. Sign in with Google to create rooms and track items.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="who-benefits-most"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">
                  Who gets the most value from Cani?
                </div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Friends, roommates, couples and families deciding on purchases together who want to vote on options and catch deals without messy chat links.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </AnimatedContent>
    </section>
  );
}
