from playwright.sync_api import sync_playwright, expect
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1100});errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 assert page.goto('http://127.0.0.1:8080').status==200
 page.get_by_role('button',name='开始作战').click()
 page.locator('[data-type="power"]').click()
 page.wait_for_timeout(9000)
 page.get_by_role('button',name='部署发电厂').click()
 box=page.locator('#battle').bounding_box()
 page.mouse.click(box['x']+box['width']*.025,box['y']+box['height']*4.5/28)
 expect(page.locator('#power')).to_have_text('130 / 20')
 page.locator('[data-type="barracks"]').click()
 page.wait_for_timeout(11000)
 page.get_by_role('button',name='部署兵营').click()
 page.mouse.click(box['x']+box['width']*.025,box['y']+box['height']*8.5/28)
 page.locator('[data-type="soldier"]').click()
 page.wait_for_timeout(5000)
 page.get_by_role('button',name='暂停',exact=True).click()
 assert page.get_by_role('button',name='继续',exact=True).is_visible()
 page.screenshot(path='output/battlefield.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 assert not errors,errors
 b.close()
 print('PASS: HTTP, start, power placement, barracks placement, production click, pause, mobile overflow, no JS errors')
