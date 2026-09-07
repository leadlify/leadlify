# Lead Companion

@connector:google_mail:"Gmail" @connector:google_maps:"Google Maps Platform" 


Build a production-quality AI Lead Generation & Cold Email CRM exclusively for my personal use. This application is private and should not be designed as a SaaS product yet. Only I will use it. Later, I may make it public, so keep the architecture scalable.

==================================================

PROJECT OVERVIEW

==================================================

The application will help me find businesses that need web design services, analyze their websites, generate personalized cold emails using AI, send emails from my Gmail account, and manage all leads in one dashboard.

Use:

- React

- TypeScript

- Tailwind CSS

- Supabase

- Supabase Authentication

- Supabase Database

- Supabase Edge Functions

- Responsive Design

- Modern UI

- Clean Code

- Modular Components

Whenever an API or credential is required, stop and ask me for it instead of using placeholders.

==================================================

DESIGN

==================================================

Create a premium modern interface.

Primary Color

#2563EB

Secondary Color

#06B6D4

Accent

#10B981

Background

White

Cards

Rounded with subtle shadows

Animations

Smooth page transitions

Loading skeletons

Fade-in effects

Hover animations

Animated counters

Toast notifications

Support:

Desktop

Tablet

Mobile

Dark Mode

Light Mode

==================================================

AUTHENTICATION

==================================================

This app is private.

Only my account should have access.

Create Login page.

Email Login

Password Login

Forgot Password

Do not create signup for public users.

Only allow me to create users manually inside Supabase later if needed.

==================================================

DATABASE

==================================================

Use Supabase.

Create these tables.

LEADS

id

business_name

owner_name

business_category

website

phone

email

address

city

country

google_rating

review_count

website_status

website_speed

seo_score

mobile_friendly

ssl_enabled

analysis

generated_email

status

notes

created_at

EMAIL_HISTORY

id

lead_id

subject

body

sent_status

sent_at

SETTINGS

id

gemini_api

google_places_api

gmail_client_id

gmail_client_secret

gmail_refresh_token

==================================================

DASHBOARD

==================================================

Create a beautiful dashboard.

Show

Total Leads

Emails Sent

Replies

Pending Leads

Closed Clients

Recent Leads

Recent Emails

Charts

Conversion Rate

==================================================

LEAD SEARCH

==================================================

Create Find Leads page.

Filters

Country

City

Business Type

Keyword

Maximum Leads

Search Radius

When I click Find Leads

Call Google Places API

Collect

Business Name

Website

Phone

Rating

Reviews

Address

Store inside Supabase automatically.

Avoid duplicate businesses.

==================================================

WEBSITE ANALYSIS

==================================================

For every business with a website

Use Gemini AI

Analyze

Website Design

UI

UX

Mobile Friendly

SEO

Speed

SSL

Call To Action

Contact Form

Portfolio

Overall Quality

Generate a detailed report.

Save inside database.

==================================================

AI EMAIL GENERATOR

==================================================

Generate personalized cold emails.

The email must mention

Business Name

Problems found

Benefits of redesign

Professional CTA

Allow

Edit

Regenerate

Copy

Preview

Save

==================================================

GMAIL

==================================================

Connect Gmail API.

Features

Connect Gmail

Disconnect Gmail

Send Email

Save sent emails

Read replies

Track delivery status when possible

==================================================

LEAD MANAGEMENT

==================================================

Status

New

Contacted

Replied

Interested

Closed

Lost

Allow

Search

Filter

Edit

Delete

Bulk Delete

Export CSV

==================================================

ANALYTICS

==================================================

Show

Total Leads

Total Emails

Reply Rate

Conversion Rate

Monthly Growth

==================================================

SETTINGS

==================================================

Create Settings page.

Allow me to securely save

Gemini API

Google Places API

Google OAuth Credentials

Store using Supabase Edge Functions.

Never expose API keys on frontend.

==================================================

SECURITY

==================================================

Enable Row Level Security.

Only authenticated users can access data.

Protect all API keys.

==================================================

ERROR HANDLING

==================================================

Handle

Invalid API Keys

No Internet

API Limits

Duplicate Leads

Missing Email

Missing Website

==================================================

FUTURE READY

==================================================

Structure the project so later I can add

Multi-user support

Subscriptions

Stripe

Teams

Role Management

AI Calling

WhatsApp Integration

LinkedIn Integration

CRM

without rewriting the application.

==================================================

IMPORTANT

==================================================

Whenever an external service is required, ask me for it in sequence.

First ask me to connect Supabase.

Then ask for Gemini API.

Then Google Cloud credentials.

Then Gmail API credentials.

Then Google Places API.

Do not continue until each integration is completed.

Guide me step by step through every connection.

Do not skip any required setup.

The application should be production-ready, scalable, clean, secure, and easy to maintain.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://leadlify.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4fe60db4-5264-400c-8498-fc35de2434e2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
