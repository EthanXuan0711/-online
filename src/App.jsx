import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

/* =============================================
   PARTICLE CANVAS COMPONENT
   ============================================= */
function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let w, h
    let mouse = { x: -1000, y: -1000 }
    let particles = []

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.5 + 0.1
        this.hue = Math.random() > 0.5 ? 245 : 175
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        const dx = this.x - mouse.x
        const dy = this.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          const force = (120 - dist) / 120
          this.x += dx * force * 0.02
          this.y += dy * force * 0.02
        }
        if (this.x < 0 || this.x > w) this.speedX *= -1
        if (this.y < 0 || this.y > h) this.speedY *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 70%, 70%, ${this.opacity})`
        ctx.fill()
      }
    }

    function resize() {
      w = canvas.width = canvas.parentElement.clientWidth
      h = canvas.height = canvas.parentElement.clientHeight
      initParticles()
    }

    function initParticles() {
      const count = Math.min(Math.floor((w * h) / 8000), 200)
      particles = []
      for (let i = 0; i < count; i++) particles.push(new Particle())
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.15
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(124, 106, 255, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h)
      particles.forEach(p => { p.update(); p.draw() })
      drawConnections()
      animId = requestAnimationFrame(animate)
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    resize()
    animate()
    window.addEventListener('resize', resize)
    document.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} />
}

/* =============================================
   HOOKS
   ============================================= */
function useScrollReveal(selector) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0
          setTimeout(() => entry.target.classList.add('visible'), parseInt(delay))
        }
      })
    }, { threshold: 0.15 })

    document.querySelectorAll(selector).forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [selector])
}

function useCounterAnimation(ref) {
  useEffect(() => {
    if (!ref.current) return
    let animated = false
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true
          ref.current.querySelectorAll('.stat-num').forEach(el => {
            const target = parseInt(el.dataset.target)
            const duration = 1500
            const start = performance.now()
            function tick(now) {
              const elapsed = now - start
              const progress = Math.min(elapsed / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 3)
              el.textContent = Math.round(target * eased)
              if (progress < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
          })
        }
      })
    }, { threshold: 0.5 })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
}

/* =============================================
   MAIN APP
   ============================================= */
function App() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formName, setFormName] = useState('')
  const statsRef = useRef(null)

  // Scroll reveal
  useScrollReveal('.pain-card, .loop-node')
  // Counter animation
  useCounterAnimation(statsRef)

  // Nav scroll effect
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Smooth scroll
  const scrollTo = useCallback((e, id) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileMenuOpen(false)
  }, [])

  // Form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = fd.get('name')
    const email = fd.get('email')
    const scene = fd.get('scene')

    const signups = JSON.parse(localStorage.getItem('eo_signups') || '[]')
    signups.push({ name, email, scene, time: new Date().toISOString() })
    localStorage.setItem('eo_signups', JSON.stringify(signups))

    setFormName(name)
    setFormSubmitted(true)
  }

  return (
    <>
      {/* ============ NAV ============ */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo" onClick={e => scrollTo(e, 'hero')}>
            <span className="logo-icon">&#9673;</span>
            <span>地球<span className="logo-hi">Online</span></span>
          </a>
          <div className={`nav-links${mobileMenuOpen ? ' open' : ''}`}>
            <a href="#pain" onClick={e => scrollTo(e, 'pain')}>场景</a>
            <a href="#how" onClick={e => scrollTo(e, 'how')}>原理</a>
            <a href="#preview" onClick={e => scrollTo(e, 'preview')}>体验</a>
            <a href="#compare" onClick={e => scrollTo(e, 'compare')}>对比</a>
            <a href="#community" className="nav-cta" onClick={e => scrollTo(e, 'community')}>加入内测</a>
          </div>
          <button
            className="nav-mobile-btn"
            aria-label="菜单"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="hero" id="hero">
        <ParticleCanvas />
        <div className="hero-content">
          <div className="hero-badge">🚀 早期内测开放中</div>
          <h1 className="hero-title">
            <span className="hero-line">你的人生</span>
            <span className="hero-line">不是被<em className="strike">算</em>出来的</span>
            <span className="hero-line">而是被<em className="glow">推演</em>出来的</span>
          </h1>
          <p className="hero-sub">
            全球首个将记忆底座、决策画像、多路径推演与结果回填修正<br />
            完整闭环的个人推演决策系统
          </p>
          <div className="hero-ctas">
            <a href="#community" className="btn btn-primary" onClick={e => scrollTo(e, 'community')}>
              <span>免费体验</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#how" className="btn btn-ghost" onClick={e => scrollTo(e, 'how')}>了解原理</a>
          </div>
          <div className="hero-stats" ref={statsRef}>
            <div className="stat">
              <span className="stat-num" data-target="5">0</span>
              <span className="stat-label">大模块闭环</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-num" data-target="30">0</span>
              <span className="stat-unit">秒</span>
              <span className="stat-label">首次体验</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-num" data-target="3">0</span>
              <span className="stat-unit">条</span>
              <span className="stat-label">路径推演</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <span>向下探索</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* ============ PAIN POINTS ============ */}
      <section className="section pain" id="pain">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">你是否也在经历</span>
            <h2 className="section-title">那些<em>反复纠结</em>的时刻</h2>
            <p className="section-desc">每一个重大决策背后，都是一场与不确定性的博弈</p>
          </div>
          <div className="pain-grid">
            {[
              { icon: '💔', scene: '关系决策', quote: '"这段关系到底要不要继续？我怕走错这一步就回不了头了。"', tag: 'P0 · 最高焦虑场景' },
              { icon: '🔀', scene: '重大选择', quote: '"跳槽还是留下？All in创业还是再等等？每条路看起来都有风险。"', tag: 'P0 · 高决策成本' },
              { icon: '⏰', scene: '时机判断', quote: '"现在是不是我的窗口期？错过了是不是就再也没有了？"', tag: 'P1 · 时间焦虑' },
              { icon: '🔄', scene: '重复困境', quote: '"为什么我总在同样的地方栽跟头？到底是哪里出了问题？"', tag: 'P2 · 模式盲区' },
            ].map((item, i) => (
              <div className="pain-card" data-delay={i * 100} key={i}>
                <div className="pain-icon">{item.icon}</div>
                <div className="pain-scene">{item.scene}</div>
                <p className="pain-quote">{item.quote}</p>
                <div className="pain-tag">{item.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="section how" id="how">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">核心原理</span>
            <h2 className="section-title">五大模块<em>完整闭环</em></h2>
            <p className="section-desc">不是一次性回答，而是持续推演、持续验证、持续修正的决策系统</p>
          </div>
          <div className="loop-track">
            {[
              { icon: '🧠', title: '记忆底座', desc: '从对话中自动识别关键转折点、决策模式和关系图谱，不需要你手动建档' },
              { icon: '📊', title: '决策画像', desc: '十维动态人格模型，不是静态标签，而是随你一起变化的时间曲线' },
              { icon: '⚡', title: '多路径推演', desc: '不给你一个答案，给你A/B/C三条路径，每条附带触发条件、风险和行动建议' },
              { icon: '🎯', title: '结果回填', desc: '推演到期后主动提醒你：说对了什么、说错了什么，系统和你一起变准' },
              { icon: '🔄', title: '持续修正', desc: '每次回填都在修正你的决策画像和推演权重，越用越懂你' },
            ].map((node, i, arr) => (
              <div key={i}>
                <div className="loop-node" data-step={i + 1}>
                  <div className="node-icon">{node.icon}</div>
                  <div className="node-content">
                    <h3>{node.title}</h3>
                    <p>{node.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="loop-connector"></div>}
              </div>
            ))}
          </div>
          {/* Anchors */}
          <div className="anchors">
            <div className="anchor-card">
              <div className="anchor-num">01</div>
              <h4>别人告诉你结果</h4>
              <p>我们给你<strong>选项和条件</strong></p>
            </div>
            <div className="anchor-card">
              <div className="anchor-num">02</div>
              <h4>别人给你一次性答案</h4>
              <p>我们和你<strong>一起验证、一起变准</strong></p>
            </div>
            <div className="anchor-card">
              <div className="anchor-num">03</div>
              <h4>别人不记得你是谁</h4>
              <p>我们<strong>越用越懂你</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PREVIEW ============ */}
      <section className="section preview" id="preview">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">产品预览</span>
            <h2 className="section-title">30秒开始你的<em>首次推演</em></h2>
            <p className="section-desc">只需回答3个问题，即可获得你的首次洞察报告</p>
          </div>
          <div className="preview-flow">
            {/* Step 1 */}
            <div className="flow-step">
              <div className="flow-num">01</div>
              <div className="mockup-screen">
                <div className="chat-bubble system">你好，我是地球Online。先聊3个问题，30秒就够。</div>
                <div className="chat-bubble system">你最近在纠结什么事？</div>
                <div className="chat-bubble user">我在考虑要不要和合伙人分开...</div>
              </div>
              <h4>自然对话</h4>
              <p>像聊天一样描述你的困境</p>
            </div>
            <div className="flow-arrow">→</div>
            {/* Step 2 */}
            <div className="flow-step">
              <div className="flow-num">02</div>
              <div className="mockup-screen">
                <div className="radar-mock">
                  <div className="radar-label tl">控制欲</div>
                  <div className="radar-label tr">信任</div>
                  <div className="radar-label bl">风险偏好</div>
                  <div className="radar-label br">防御性</div>
                  <div className="radar-shape"></div>
                </div>
                <div className="mock-badge">初步印象 · 4维已识别</div>
              </div>
              <h4>决策画像生成</h4>
              <p>AI即时构建你的人格轮廓</p>
            </div>
            <div className="flow-arrow">→</div>
            {/* Step 3 */}
            <div className="flow-step">
              <div className="flow-num">03</div>
              <div className="mockup-screen path-screen">
                <div className="path-item path-a">
                  <span className="path-label">路径A: 主动摊牌</span>
                  <div className="path-bar" style={{'--w': '75%'}}><span>概率 45%</span></div>
                </div>
                <div className="path-item path-b">
                  <span className="path-label">路径B: 观察等待</span>
                  <div className="path-bar" style={{'--w': '58%'}}><span>概率 35%</span></div>
                </div>
                <div className="path-item path-c">
                  <span className="path-label">路径C: 战略撤退</span>
                  <div className="path-bar" style={{'--w': '35%'}}><span>概率 20%</span></div>
                </div>
                <div className="mock-badge green">高把握 · 90天内可验证</div>
              </div>
              <h4>多路径推演</h4>
              <p>每条路径附带触发条件和风险</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ COMPARE ============ */}
      <section className="section compare" id="compare">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">为什么选我们</span>
            <h2 className="section-title">不是ChatGPT，不是算命App</h2>
            <p className="section-desc">五个维度，看清本质差异</p>
          </div>
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>能力维度</th>
                  <th className="hi">地球Online</th>
                  <th>ChatGPT</th>
                  <th>命理App</th>
                  <th>记忆AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['长期记忆', '✅ 三层记忆 + 被动抽取', '❌ 无持久记忆', '❌ 无', '✅ 有'],
                  ['决策画像', '✅ 十维动态 + 时间曲线', '❌ 无', '⚠️ 静态标签', '❌ 无'],
                  ['多路径推演', '✅ A/B/C路径 + 五维自检', '⚠️ 单一建议', '⚠️ 单一解读', '❌ 无'],
                  ['结果回填', '✅ 主动追踪 + 命中率', '❌ 无', '❌ 无', '❌ 无'],
                  ['越用越准', '✅ 回填修正闭环', '❌ 每次从零开始', '❌ 永远静态', '⚠️ 记忆但不推演'],
                ].map(([dim, ...vals], i) => (
                  <tr key={i}>
                    <td>{dim}</td>
                    <td className="hi">{vals[0]}</td>
                    <td>{vals[1]}</td>
                    <td>{vals[2]}</td>
                    <td>{vals[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============ COMMUNITY ============ */}
      <section className="section community" id="community">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">加入我们</span>
            <h2 className="section-title">成为<em>前100名</em>种子用户</h2>
            <p className="section-desc">早期用户享永久内测权益 + 优先体验所有新功能</p>
          </div>
          <div className="community-grid">
            {/* Form */}
            <div className="comm-card">
              <h3>🎯 预约内测资格</h3>
              <p>留下联系方式，产品上线第一时间通知你</p>
              {formSubmitted ? (
                <div className="form-success">
                  <div className="emoji">🎉</div>
                  <h4>预约成功!</h4>
                  <p>{formName}, 我们会在产品上线时第一时间通知你</p>
                </div>
              ) : (
                <form className="comm-form" onSubmit={handleSubmit}>
                  <input type="text" name="name" placeholder="你的称呼" required />
                  <input type="email" name="email" placeholder="邮箱地址" required />
                  <input type="text" name="scene" placeholder="你最想推演什么场景？（选填）" />
                  <button type="submit" className="btn btn-primary btn-full">
                    <span>立即预约</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </form>
              )}
              <p className="form-note">🔒 信息仅用于内测通知，绝不外泄</p>
            </div>
            {/* Channels */}
            <div className="comm-card">
              <h3>💬 加入社群</h3>
              <p>和我们一起打磨产品，你的反馈直接影响产品走向</p>
              <div className="channel-list">
                <a href="#" className="channel">
                  <div className="channel-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.177-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.84-5.913-7.062-6.122zM14.033 13.2c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/></svg>
                  </div>
                  <div className="channel-info">
                    <span className="channel-name">微信社群</span>
                    <span className="channel-desc">扫码加入内测群</span>
                  </div>
                  <span className="channel-arrow">→</span>
                </a>
                <a href="#" className="channel">
                  <div className="channel-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>
                  </div>
                  <div className="channel-info">
                    <span className="channel-name">Discord</span>
                    <span className="channel-desc">海外社区 & 开发者</span>
                  </div>
                  <span className="channel-arrow">→</span>
                </a>
                <a href="#" className="channel">
                  <div className="channel-icon">📕</div>
                  <div className="channel-info">
                    <span className="channel-name">小红书</span>
                    <span className="channel-desc">关注获取推演思维内容</span>
                  </div>
                  <span className="channel-arrow">→</span>
                </a>
                <a href="#" className="channel">
                  <div className="channel-icon">⚡</div>
                  <div className="channel-info">
                    <span className="channel-name">即刻</span>
                    <span className="channel-desc">产品动态 & 开发日志</span>
                  </div>
                  <span className="channel-arrow">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="logo-icon">&#9673;</span>
              <span>地球<span className="logo-hi">Online</span></span>
              <p className="footer-tagline">个人推演决策系统</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>产品</h4>
                <a href="#how" onClick={e => scrollTo(e, 'how')}>核心原理</a>
                <a href="#preview" onClick={e => scrollTo(e, 'preview')}>产品预览</a>
                <a href="#compare" onClick={e => scrollTo(e, 'compare')}>竞品对比</a>
              </div>
              <div className="footer-col">
                <h4>社群</h4>
                <a href="#">微信群</a>
                <a href="#">Discord</a>
                <a href="#">小红书</a>
              </div>
              <div className="footer-col">
                <h4>合作</h4>
                <a href="mailto:contact@earthonline.ai">投资合作</a>
                <a href="mailto:contact@earthonline.ai">商务联系</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 地球Online. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
