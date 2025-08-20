import { Link } from 'next-view-transitions'
import { AppConfig } from '@/boilerplate.config'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FacebookIcon, InstagramIcon } from 'lucide-react'
import { XIcon } from '@/components/ui/icons/x-icon'

export function ContactSection() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-4xl px-4 lg:px-0">
        <h1 className="mb-12 text-center text-4xl font-semibold lg:text-5xl">
          Help us route your inquiry at {AppConfig.name}
        </h1>

        <div className="grid divide-y border md:grid-cols-2 md:gap-4 md:divide-x md:divide-y-0">
          <div className="flex flex-col justify-between space-y-8 p-6 sm:p-12">
            <div>
              <h2 className="mb-3 text-lg font-semibold">Collaborate</h2>
              <Link
                href={`mailto:${AppConfig.links.mail}`}
                className="text-lg text-blue-600 hover:underline dark:text-blue-400"
              >
                {AppConfig.links.mail}
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-between space-y-8 p-6 sm:p-12">
            <div>
              <h3 className="mb-3 text-lg font-semibold">Social Media</h3>
              <div className="flex flex-wrap gap-4">
                {AppConfig.links.linkedin && (
                  <Link
                    href={AppConfig.links.linkedin}
                    className="flex items-center text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.762 2.239 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.79-1.75-1.764 0-.974.784-1.764 1.75-1.764s1.75.79 1.75 1.764c0 .974-.784 1.764-1.75 1.764zm13.5 11.268h-3v-5.604c0-1.338-.026-3.065-1.867-3.065-1.868 0-2.154 1.459-2.154 2.966v5.703h-3v-10h2.884v1.367h.041c.402-.761 1.384-1.562 2.847-1.562 3.041 0 3.605 2.001 3.605 4.604v5.591z" />
                    </svg>
                  </Link>
                )}
                {AppConfig.links.twitter && (
                  <Link
                    href={AppConfig.links.twitter}
                    className="flex items-center text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <XIcon className="size-5" />
                  </Link>
                )}
                {AppConfig.links.facebook && (
                  <Link
                    href={AppConfig.links.facebook}
                    className="flex items-center text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <FacebookIcon className="size-5" />
                  </Link>
                )}
                {AppConfig.links.instagram && (
                  <Link
                    href={AppConfig.links.instagram}
                    className="flex items-center text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <InstagramIcon className="size-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-3 border-x bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_6px)]"></div>
        <form action="" className="border px-4 py-12 lg:px-0 lg:py-24">
          <Card className="mx-auto max-w-lg p-8 sm:p-16">
            <h3 className="text-xl font-semibold">
              Let's get you to the right place at {AppConfig.name}
            </h3>
            <p className="mt-4 text-sm">
              Reach out to our sales team at {AppConfig.links.mail}! We’re eager
              to learn more about how you plan to use our application.
            </p>

            <div className="**:[&>label]:block mt-12 space-y-6 *:space-y-3">
              <div>
                <Label htmlFor="name" className="space-y-2">
                  Full name
                </Label>
                <Input type="text" id="name" required />
              </div>
              <div>
                <Label htmlFor="email" className="space-y-2">
                  Work Email
                </Label>
                <Input type="email" id="email" required />
              </div>
              <div>
                <Label htmlFor="country" className="space-y-2">
                  Country/Region
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">DR Congo</SelectItem>
                    <SelectItem value="2">United States</SelectItem>
                    <SelectItem value="3">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website" className="space-y-2">
                  Company Website
                </Label>
                <Input type="url" id="website" />
              </div>
              <div>
                <Label htmlFor="job" className="space-y-2">
                  Job function
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Finance</SelectItem>
                    <SelectItem value="2">Education</SelectItem>
                    <SelectItem value="3">Legal</SelectItem>
                    <SelectItem value="4">More</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="msg" className="space-y-2">
                  Message
                </Label>
                <Textarea id="msg" rows={3} />
              </div>
              <Button>Submit</Button>
            </div>
          </Card>
        </form>
      </div>
    </section>
  )
}
