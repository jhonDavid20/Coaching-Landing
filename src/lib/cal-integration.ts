// Cal.com integration utilities

export const openCalBooking = (source: string, eventType = "15min") => {
  // Track the source for analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "cal_booking_opened", {
      event_category: "engagement",
      event_label: source,
    })
  }

  // Option 1: Direct link (replace with your actual Cal.com link)
  const calLink = `https://cal.com/your-username/${eventType}?utm_source=${source}`
  window.open(calLink, "_blank")

  // Option 2: Cal.com embed (uncomment to use)
  // if (typeof window !== 'undefined' && window.Cal) {
  //   window.Cal('openModal', {
  //     calLink: `your-username/${eventType}`,
  //     config: {
  //       name: 'Fitness Consultation',
  //       notes: `Booking source: ${source}`,
  //       email: '', // Pre-fill if available
  //       smsReminderNumber: '',
  //       guests: []
  //     }
  //   })
  // }
}

// Cal.com embed script loader
export const loadCalScript = () => {
  if (typeof window !== "undefined" && !window.Cal) {
    const script = document.createElement("script")
    script.src = "https://app.cal.com/embed/embed.js"
    script.async = true
    document.head.appendChild(script)
  }
}

// Types for Cal.com
declare global {
  interface Window {
    Cal: any
    gtag: any
  }
}
