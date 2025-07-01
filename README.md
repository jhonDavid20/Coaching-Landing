# Fitness Coaching Landing Page

A modern, minimalistic landing page for fitness and nutrition coaching services with an interactive assessment form and real-time BMI calculator.

## ✨ Features

- **Interactive Assessment Form** - Collects client information with real-time BMI calculation
- **Personalized Recommendations** - Generates custom advice based on goals and fitness level
- **Cal.com Integration** - Multiple booking touchpoints for consultations
- **Responsive Design** - Optimized for all devices
- **Lead Generation** - Strategic conversion flow with form validation
- **Minimalistic UI** - Clean design with 3 neutral colors

## 🚀 Demo

[Live Demo](https://coaching-landing-kappa.vercel.app/en)

## 🛠️ Tech Stack

- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form 
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Booking**: Cal.com integration
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## ⚡ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/jhondavid20/coaching-landing.git
   cd coaching-landing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Optional: Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Optional: Cal.com
NEXT_PUBLIC_CAL_LINK=your-cal-com-username

# Optional: Email service (for form submissions)
EMAIL_SERVICE_API_KEY=your-email-service-key
```

### Customization

1. **Update Content**: Edit text content in each component file
2. **Branding**: Modify colors in `tailwind.config.js`
3. **Form Fields**: Adjust form schema in `lib/validations.ts`
4. **Cal.com**: Update booking links in `components/CalBooking.tsx`

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main landing page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── sections/
│   │   ├── Hero.tsx             # Hero section with CTAs
│   │   ├── Assessment.tsx       # Assessment form section
│   │   ├── Services.tsx         # Services overview
│   │   └── About.
