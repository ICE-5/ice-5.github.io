module Jekyll
    class ParticlesPageGenerator < Generator
        safe true

        def generate(site)
            if site.data['particles']
                particles = site.data['particles']['particles']
                particles.each do |project|
                    site.pages << ParticlesDataPage.new(site, site.source, project)
            end
        end
        end
    end

    class ParticlesDataPage < Page
        def initialize(site, base, project)
        @site = site
        @base = base
        @dir = File.join('particles', 'exp-'+project['id'].to_s)
        @name = "index.html"

        self.process(@name)
        self.read_yaml(File.join(base, '_layouts'), 'particles.html')
        self.data['exp-title'] = project['exp-title']
        self.data['id'] = project['id']
        self.data['src'] = project['src']
        self.data['description'] = project['description']
        self.data['references'] = project['references']
    end
    end
end