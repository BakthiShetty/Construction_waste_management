import { Component, type OnInit, type OnDestroy, ViewEncapsulation } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router, RouterModule } from "@angular/router"

@Component({
  selector: "app-about",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./about.html",
  styleUrls: ["./about.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AboutComponent implements OnInit, OnDestroy {
  private observer!: IntersectionObserver
  private statsObserver!: IntersectionObserver
  private counterAnimations: { [key: string]: boolean } = {}
  constructor(
  private router : Router){}
  // Team data
  teamMembers = [
    {
      name: "Pratham Ajeru",
      role: "Junior Software Developer",
      avatar: "👨‍💼",
      description: "Turning coffee into code, one bug at a time.",
      linkedin: "https://www.linkedin.com/in/pratham-ajeru-147287199/",
    },
    {
      name: "Bakthi Shetty",
      role: "Junior Software Developer",
      avatar: "👩‍💻",
      description: "Building the future, one line of code at a time.",
      linkedin: "https://www.linkedin.com/in/bakthi-s-shetty-34aaa3267/",
    },
  ]

  // Stats data
  stats = [
    {
      id: "savings",
      number: "₹2L+",
      label: "Saved by EcoBuild India",
      target: 200000,
      suffix: "L+",
      prefix: "₹",
    },
    {
      id: "diverted",
      number: "12T",
      label: "Diverted from landfill",
      target: 12,
      suffix: "T",
    },
    {
      id: "reused",
      number: "3T",
      label: "Wood reused by URP",
      target: 3,
      suffix: "T",
    },
    {
      id: "co2",
      number: "3.4T",
      label: "CO₂ reduced",
      target: 3.4,
      suffix: "T",
    },
  ]

  // Features data
  features = [
    {
      icon: "🌍",
      title: "Our Vision",
      description:
        "To establish a zero-waste construction future in India—where every material finds new life and contributes to a sustainable tomorrow.",
    },
    {
      icon: "🎯",
      title: "Our Mission",
      description:
        "Empowering sustainable exchanges in construction materials—reducing waste, cutting costs, and minimizing emissions through innovative digital solutions.",
    },
    {
      icon: "🏗️",
      title: "What is ReconX?",
      description:
        "A revolutionary digital marketplace connecting builders, contractors, and recyclers—creating value while protecting our planet.",
    },
  ]

  ngOnInit(): void {
    setTimeout(() => {
      this.initScrollAnimations()
      this.initStatsAnimation()
    }, 100)
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
    if (this.statsObserver) {
      this.statsObserver.disconnect()
    }
  }

  private initScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate")
        }
      })
    }, observerOptions)

    document.querySelectorAll(".fade-in").forEach((el) => {
      this.observer.observe(el)
    })
  }

  private initStatsAnimation(): void {
    this.statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const statId = entry.target.getAttribute("data-stat-id")
            if (statId && !this.counterAnimations[statId]) {
              this.counterAnimations[statId] = true
              const stat = this.stats.find((s) => s.id === statId)
              if (stat) {
                this.animateCounter(entry.target as HTMLElement, stat)
              }
            }
          }
        })
      },
      { threshold: 0.5 },
    )

    setTimeout(() => {
      document.querySelectorAll(".stat-card").forEach((card) => {
        this.statsObserver.observe(card)
      })
    }, 200)
  }

  private animateCounter(element: HTMLElement, stat: any, duration = 2000): void {
    const numberElement = element.querySelector(".stat-number") as HTMLElement
    if (!numberElement) return

    const start = 0
    const target = stat.target
    const increment = target / (duration / 16)
    let current = start

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }

      let displayValue = ""

      if (stat.prefix) {
        displayValue += stat.prefix
      }
      if (target >= 100000) {
        displayValue += Math.floor(current / 100000)
      } else if (target < 10) {
        displayValue += current.toFixed(1)
      } else {
        displayValue += Math.floor(current)
      }
      if (stat.suffix) {
        displayValue += stat.suffix
      }

      numberElement.textContent = displayValue
    }, 16)
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }
    // Navigation
  goBack(): void {
    this.router.navigate([""])
  }
}
