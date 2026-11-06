import { Component, ViewChild, type ElementRef, type OnInit, type OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./home.html",
  styleUrls: ["./home.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild("scrollContainer", { static: false }) scrollContainer!: ElementRef
  private observer!: IntersectionObserver

  ngOnInit(): void {
    setTimeout(() => {
      this.initScrollAnimations()
    }, 100)
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect()
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

  scroll(direction: number) {
    const container = this.scrollContainer.nativeElement
    const scrollAmount = 320
    container.scrollBy({ left: scrollAmount * direction, behavior: "smooth" })
  }

  materials = [
    {
      name: "Bricks",
      image: "https://th.bing.com/th/id/OIP.HiCXfzJNgxCzMTnitue6-AHaE8?w=263&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3",
      description: "Sturdy bricks for foundations or walls.",
    },
    {
      name: "Sand",
      image: "https://th.bing.com/th/id/OIP.ukEYVARgl_lEgZSsEiBWMgHaFV?w=246&h=180&c=7&r=0&o=5&dpr=1.5&pid=1.7",
      description: "Clean construction-grade sand.",
    },
    {
      name: "Steel",
      image: "https://5.imimg.com/data5/WR/EL/JW/SELLER-12811270/construction-iron-rod.jpg",
      description: "Steel rods and beams for reuse.",
    },
    {
      name: "Cement",
      image: "https://ts4.mm.bing.net/th?id=OIP.TYbgOOotjlKzjbj1QhYQGgHaFi&pid=15.1",
      description: "Leftover cement for small-scale use.",
    },
    {
      name: "Wood",
      image: "https://th.bing.com/th/id/OIP.1AaOmrBxl29FH-x5lgVVoAHaDt?w=290&h=175&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3",
      description: "Wooden planks for reuse in interiors.",
    },
    {
      name: "Tiles",
      image:
        "https://nirogranite.com/wp-content/uploads/2023/05/Understanding-Homogeneous-Tiles-And-Differences-To-Other-Tiles-scaled-1.jpeg",
      description: "Durable ceramic tiles for reuse.",
    },
    {
      name: "Glass",
      image: "https://5.imimg.com/data5/SELLER/Default/2021/3/ZA/SN/OP/78085371/transparent-window-glass-500x500.png",
      description: "Glass panes perfect for windows.",
    },
    {
      name: "Paint",
      image: "https://5.imimg.com/data5/CM/ZC/OS/SELLER-8087436/asian-paints-all-product-500x500.jpg",
      description: "Extra paint perfect for reuse in renovations or touch-ups.",
    },
  ]

  // Stats for hero section
  stats = [
    { number: "500+", label: "Projects Completed" },
    { number: "1000T+", label: "Waste Diverted" },
    { number: "50+", label: "Active Partners" },
  ]
}
