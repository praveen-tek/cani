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
            Every good agent starts with a few good questions.
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
                  Cani watches products you care about and acts on your behalf —
                  tracking restocks, price drops, and new releases so you don't
                  have to check manually.
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
                  Pin any product page and tell Cani what to watch for in plain
                  language. It monitors the page and reasons about whether a
                  change actually matches your intent.
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
                  As soon as a relevant change is detected, you get an email.
                  You can even reply to that email to adjust or cancel the
                  watch.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="watch-for-someone-else"
              className="py-5 border-b border-gray-200"
            >
              <AccordionTrigger className="w-full py-0.5 text-left text-gray-900 flex items-center justify-between">
                <div className="text-lg">
                  Can I watch something for someone else?
                </div>
                <Plus className="h-4 w-4 text-gray-900 transition-transform duration-200 group-data-expanded:rotate-45" />
              </AccordionTrigger>
              <AccordionContent className="origin-top">
                <p className="pr-8 pt-3 text-gray-500">
                  Yes. You can set up a watch on behalf of another person and
                  Cani will notify whoever you choose.
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
                  Cani works on most product pages out of the box. If a page
                  needs special handling, our detection can be extended to
                  support it.
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
                  Cani is free during early access. Pricing for advanced
                  automation features will be introduced later.
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
                  Anyone tired of manually refreshing product pages — restock
                  hunters, deal seekers, and gift planners waiting on the right
                  drop.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </AnimatedContent>
    </section>
  );
}
